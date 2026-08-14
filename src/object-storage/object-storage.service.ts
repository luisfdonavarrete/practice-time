import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectStorageConfigService } from '../app-config/object-storage.config.service';

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client;
  private readonly signingClient: S3Client;

  constructor(private readonly config: ObjectStorageConfigService) {
    const credentials =
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials,
    });
    this.signingClient = new S3Client({
      region: config.region,
      endpoint: config.publicEndpoint,
      forcePathStyle: config.forcePathStyle,
      credentials,
    });
  }

  put(key: string, body: Buffer, contentType: string): Promise<unknown> {
    return this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  delete(key: string): Promise<unknown> {
    return this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }

  getSignedReadUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.signingClient,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
      { expiresIn: this.config.signedUrlTtlSeconds },
    );
  }
}
