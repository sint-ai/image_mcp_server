import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import { z } from 'zod';

config();

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']).default('development'),
        PORT: z.coerce.number().default(3000),
        OPENAI_API_KEY: z.string(),
        ANTHROPIC_API_KEY: z.string(),
        MINIO_BUCKET_URL: z.string(),
        S3_USE_SSL: z.coerce.boolean().default(false),
        MINIO_ACCESS_KEY: z.string(),
        MINIO_SECRET_KEY: z.string(),
        MINIO_BUCKET_NAME: z.string(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
