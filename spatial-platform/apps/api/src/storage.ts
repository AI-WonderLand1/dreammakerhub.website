import { Client } from 'minio'
import { config } from './config.js'

export const minio = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
  useSSL: config.minio.useSSL,
})

export async function ensureBucket(): Promise<void> {
  const exists = await minio.bucketExists(config.minio.bucket)
  if (!exists) {
    await minio.makeBucket(config.minio.bucket, 'us-east-1')
  }
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  await minio.putObject(config.minio.bucket, key, buffer, buffer.length, {
    'Content-Type': mimeType,
  })
  return `${config.minio.endpoint}/${config.minio.bucket}/${key}`
}

export async function getFileUrl(key: string): Promise<string> {
  return await minio.presignedGetObject(config.minio.bucket, key, 24 * 60 * 60)
}

export async function deleteFile(key: string): Promise<void> {
  await minio.removeObject(config.minio.bucket, key)
}

export async function listFiles(prefix: string): Promise<string[]> {
  const objects: string[] = []
  const stream = minio.listObjects(config.minio.bucket, prefix, true)
  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => objects.push(obj.name))
    stream.on('end', () => resolve(objects))
    stream.on('error', reject)
  })
}
