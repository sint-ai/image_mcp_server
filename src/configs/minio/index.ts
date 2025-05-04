import * as Minio from 'minio';
import { env } from '../env.js';

const minioUrl = new URL(env.MINIO_BUCKET_URL);

export const minio = new Minio.Client({
    endPoint: minioUrl.hostname,
    port: minioUrl.port ? +minioUrl.port : 443,
    useSSL: env.S3_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY
});