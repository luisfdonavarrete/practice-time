import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ObjectStorageConfigService } from '../app-config/object-storage.config.service';
import { AppConfigModule } from '../app-config/app.config.module';
import { ObjectStorageModule } from '../object-storage/object-storage.module';
import { AssignmentItemResource } from '../student-assignments/entities/assignment-item-resource.entity';
import { StudentAssignmentItem } from '../student-assignments/entities/student-assignment-item.entity';
import { AssignmentResourcesController } from './assignment-resources.controller';
import { AssignmentResourcesService } from './assignment-resources.service';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([AssignmentItemResource, StudentAssignmentItem]),
    MulterModule.registerAsync({
      imports: [AppConfigModule],
      inject: [ObjectStorageConfigService],
      useFactory: (config: ObjectStorageConfigService) => ({
        limits: { fileSize: config.maxUploadBytes },
      }),
    }),
    ObjectStorageModule,
  ],
  controllers: [AssignmentResourcesController],
  providers: [AssignmentResourcesService],
})
export class AssignmentResourcesModule {}
