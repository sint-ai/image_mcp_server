import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Mock environment before imports
beforeAll(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('MINIO_ENDPOINT', 'localhost');
    vi.stubEnv('MINIO_PORT', '9000');
    vi.stubEnv('MINIO_ACCESS_KEY', 'test-access-key');
    vi.stubEnv('MINIO_SECRET_KEY', 'test-secret-key');
    vi.stubEnv('MINIO_BUCKET_NAME', 'test-bucket');
    vi.stubEnv('MINIO_BUCKET_URL', 'http://localhost:9000');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
});

// Store registered tool handlers
const toolHandlers: Record<string, (input: any, extra: any) => Promise<any>> = {};

// Mock McpServer to capture tool registrations
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
    return {
        McpServer: class MockMcpServer {
            constructor() {}
            tool(name: string, _description: string, _schema: any, handler: any) {
                toolHandlers[name] = handler;
            }
        },
    };
});

// Mock openai with inline mock object
vi.mock('./configs/openai/index.js', () => ({
    openai: {
        images: {
            edit: vi.fn(),
        },
    },
}));

// Mock refinePrompt
vi.mock('./lib/refinePrompt.js', () => ({
    default: vi.fn().mockResolvedValue('refined prompt'),
}));

// Mock uploadToS3
vi.mock('./lib/uploadToS3.js', () => ({
    default: vi.fn().mockResolvedValue(undefined),
}));

// Mock get64bitRandom
vi.mock('./lib/get64BitRandom.js', () => ({
    get64bitRandom: vi.fn().mockReturnValue('abc123'),
}));

// Mock toFile from openai
vi.mock('openai', () => ({
    toFile: vi.fn().mockResolvedValue({ name: 'sint.jpeg' }),
}));

// Mock fs
vi.mock('node:fs', () => ({
    default: {
        createReadStream: vi.fn().mockReturnValue({}),
    },
}));

import { createMcp } from './mcp.js';
import { openai } from './configs/openai/index.js';
import refinePrompt from './lib/refinePrompt.js';
import uploadToS3 from './lib/uploadToS3.js';

describe('mcp.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear tool handlers and re-register
        Object.keys(toolHandlers).forEach((key) => delete toolHandlers[key]);
        createMcp();
    });

    describe('createMcp', () => {
        it('should create an MCP server instance', () => {
            const mcp = createMcp();
            expect(mcp).toBeDefined();
        });

        it('should register create_meme tool', () => {
            expect(toolHandlers['create_meme']).toBeDefined();
        });
    });

    describe('create_meme tool', () => {
        it('should call refinePrompt with input', async () => {
            vi.mocked(openai.images.edit).mockResolvedValue({
                data: [{ b64_json: Buffer.from('test image').toString('base64') }],
            } as any);

            await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(refinePrompt).toHaveBeenCalledWith('funny cat meme');
        });

        it('should call openai.images.edit with refined prompt', async () => {
            vi.mocked(openai.images.edit).mockResolvedValue({
                data: [{ b64_json: Buffer.from('test image').toString('base64') }],
            } as any);

            await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(openai.images.edit).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: 'refined prompt',
                    n: 1,
                    model: 'gpt-image-1',
                    size: '1024x1024',
                })
            );
        });

        it('should upload images to S3', async () => {
            vi.mocked(openai.images.edit).mockResolvedValue({
                data: [{ b64_json: Buffer.from('test image').toString('base64') }],
            } as any);

            await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(uploadToS3).toHaveBeenCalledWith(
                'test-bucket',
                expect.any(Object),
                'public'
            );
        });

        it('should return image URLs on success', async () => {
            vi.mocked(openai.images.edit).mockResolvedValue({
                data: [{ b64_json: Buffer.from('test image').toString('base64') }],
            } as any);

            const result = await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(result.content[0].text).toContain('Generated images urls');
            expect(result.content[0].text).toContain('http://localhost:9000/test-bucket/public/');
        });

        it('should handle empty data array gracefully', async () => {
            // Note: Current code has a bug - accessing [0].b64_json on empty array throws
            // This test documents actual behavior; code should use optional chaining
            vi.mocked(openai.images.edit).mockResolvedValue({
                data: [],
            } as any);

            const result = await toolHandlers['create_meme']({ input: 'funny cat meme' });

            // Actual behavior: throws error due to missing optional chaining
            expect(result.content[0].text).toContain('Error message:');
        });

        it('should return error message when b64_json is missing', async () => {
            vi.mocked(openai.images.edit).mockResolvedValue({
                data: [{ url: 'http://example.com/image.png' }],
            } as any);

            const result = await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(result.content[0].text).toBe('No image generated');
        });

        it('should handle errors gracefully', async () => {
            vi.mocked(openai.images.edit).mockRejectedValue(new Error('API rate limit exceeded'));

            const result = await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(result.content[0].text).toContain('Error message: API rate limit exceeded');
        });

        it('should handle refinePrompt errors', async () => {
            vi.mocked(refinePrompt).mockRejectedValueOnce(new Error('Refinement failed'));

            const result = await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(result.content[0].text).toContain('Error message: Refinement failed');
        });

        it('should handle S3 upload errors', async () => {
            vi.mocked(openai.images.edit).mockResolvedValue({
                data: [{ b64_json: Buffer.from('test image').toString('base64') }],
            } as any);
            vi.mocked(uploadToS3).mockRejectedValueOnce(new Error('S3 upload failed'));

            const result = await toolHandlers['create_meme']({ input: 'funny cat meme' });

            expect(result.content[0].text).toContain('Error message: S3 upload failed');
        });
    });
});
