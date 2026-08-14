import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectStorageConfigService {
  constructor(private readonly configService: ConfigService) {}

  get region(): string {
    return this.configService.getOrThrow<string>('S3_REGION');
  }

  get bucket(): string {
    return this.configService.getOrThrow<string>('S3_BUCKET');
  }

  get endpoint(): string | undefined {
    return (
      this.configService.get<string>('S3_ENDPOINT') ??
      (this.isProduction ? undefined : 'http://localhost:4566')
    );
  }

  get publicEndpoint(): string | undefined {
    return (
      this.configService.get<string>('S3_PUBLIC_ENDPOINT') ?? this.endpoint
    );
  }

  get accessKeyId(): string | undefined {
    return (
      this.configService.get<string>('S3_ACCESS_KEY_ID') ??
      (this.isProduction ? undefined : 'test')
    );
  }

  get secretAccessKey(): string | undefined {
    return (
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') ??
      (this.isProduction ? undefined : 'test')
    );
  }

  get forcePathStyle(): boolean {
    return (
      this.configService.get<boolean>('S3_FORCE_PATH_STYLE') ??
      !this.isProduction
    );
  }

  get signedUrlTtlSeconds(): number {
    return this.configService.getOrThrow<number>('S3_SIGNED_URL_TTL_SECONDS');
  }

  get maxUploadBytes(): number {
    return this.configService.getOrThrow<number>('RESOURCE_MAX_UPLOAD_BYTES');
  }

  private get isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
