import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { File } from 'node:buffer';
import fs from 'node:fs';
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { toFile } from "openai";
import path from "path";
import { z } from "zod";
import { env } from "./configs/env.js";
import { openai } from "./configs/openai/index.js";
import refinePrompt from "./lib/refinePrompt.js";
import uploadToS3 from "./lib/uploadToS3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sintImage = await toFile(
    fs.createReadStream(path.resolve(__dirname, "../src/assets/sint.jpeg")), null, { type: "image/png", }
)

export const createMcp = () => {
    const mcp = new McpServer({
        name: 'twitter-mcp',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        },
    });

    mcp.tool(
        'create_meme',
        'Create a meme from user input',
        {
            input: z.string({ description: 'User input, description of the meme' }),
        },
        async ({ input }) => {
            try {
                const refiningStartTime = Date.now();
                const refinedInput = await refinePrompt(input);
                const refiningTime = Date.now() - refiningStartTime;
                console.log('Start generating: ', {
                    originalInput: input,
                    refinedInput,
                    refiningTook: `${refiningTime}ms`
                })
                const generationStartTime = Date.now();
                const res = await openai.images.edit({
                    image: sintImage,
                    prompt: refinedInput,
                    n: 1,
                    model: 'gpt-image-1',
                    size: '1024x1024',
                })
                const generationTime = Date.now() - generationStartTime;
                console.log(`Image generation took ${generationTime}ms`);
                if (!res.data?.[0].b64_json) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'No image generated'
                            }
                        ] as TextContent[]
                    };
                }
                const images: File[] = await Promise.all(res.data.map(async image => {
                    const buffer = Buffer.from(image.b64_json!, 'base64');
                    const fileName = `image_${randomUUID()}.jpeg`;
                    const file = new File([buffer], fileName, { type: 'image/jpeg' });
                    await uploadToS3(env.MINIO_BUCKET_NAME, file, 'public');
                    return file;
                }))
                const imagesUrls = images.map(i => `${env.MINIO_BUCKET_URL}/${env.MINIO_BUCKET_NAME}/public/${i.name}`)
                console.log('Finished generating: ', {
                    memeGenerationTook: `${refiningTime + generationTime}ms`,
                    images: imagesUrls,
                })

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Generated images urls:\n ${imagesUrls.join('\n')}

                            Use markdown to send images to user come up with a image name based on context:
                            ![Image name](image url)
                            `
                        }
                    ] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    )

    return mcp;
}
