import { Module } from '@nestjs/common';
import { AppConfigModule } from '../app-config/app.config.module';
import { ObjectStorageService } from './object-storage.service';

@Module({
  imports: [AppConfigModule],
  providers: [ObjectStorageService],
  exports: [ObjectStorageService],
})
export class ObjectStorageModule {}
