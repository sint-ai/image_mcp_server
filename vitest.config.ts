import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        env: {
            NODE_ENV: 'development',
            MINIO_ENDPOINT: 'localhost',
            MINIO_PORT: '9000',
            MINIO_ACCESS_KEY: 'test-access-key',
            MINIO_SECRET_KEY: 'test-secret-key',
            MINIO_BUCKET_NAME: 'test-bucket',
            MINIO_BUCKET_URL: 'http://localhost:9000',
            ANTHROPIC_API_KEY: 'test-anthropic-key',
            OPENAI_API_KEY: 'test-openai-key',
        },
    },
});
