import lodash from 'lodash';
import { env } from '../configs/env.js';
import { minio } from '../configs/minio/index.js';
import { File } from 'node:buffer'

minio.listObjects(env.MINIO_BUCKET_NAME, 'public')
export default async function uploadToS3(
    bucketName: string,
    file: File,
    folder: string
) {
    bucketName = lodash.kebabCase(bucketName);
    if (bucketName && !(await minio.bucketExists(lodash.kebabCase(bucketName)))) {
        await minio.makeBucket(bucketName);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    return await minio.putObject(
        bucketName,
        `${folder}/${file.name}`,
        buffer,
        file.size,
        { type: file.type }
    );
}