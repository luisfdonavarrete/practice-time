import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { ObjectStorageConfigService } from '../app-config/object-storage.config.service';
import { ObjectStorageService } from '../object-storage/object-storage.service';
import {
  AssignmentItemResource,
  AssignmentResourceKind,
} from '../student-assignments/entities/assignment-item-resource.entity';
import { StudentAssignmentItem } from '../student-assignments/entities/student-assignment-item.entity';
import { StudentAssignmentStatus } from '../student-assignments/entities/student-assignment.entity';
import { CreateLinkResourceDto } from './dto/create-link-resource.dto';
import { CreateUploadResourceDto } from './dto/create-upload-resource.dto';
import {
  sanitizeFilename,
  validateResourceFile,
} from './resource-file-validation';

@Injectable()
export class AssignmentResourcesService {
  constructor(
    @InjectRepository(AssignmentItemResource)
    private readonly resourceRepository: Repository<AssignmentItemResource>,
    @InjectRepository(StudentAssignmentItem)
    private readonly itemRepository: Repository<StudentAssignmentItem>,
    private readonly dataSource: DataSource,
    private readonly storage: ObjectStorageService,
    private readonly storageConfig: ObjectStorageConfigService,
  ) {}

  async createUpload(
    ownerUserId: string,
    itemId: string,
    dto: CreateUploadResourceDto,
    file: Express.Multer.File | undefined,
  ): Promise<AssignmentItemResource> {
    await this.requireWritableItem(ownerUserId, itemId);
    const mimeType = validateResourceFile(
      file,
      this.storageConfig.maxUploadBytes,
    );
    const upload = file!;
    const sha256 = createHash('sha256').update(upload.buffer).digest('hex');
    const assetKey = `assignment-resources/${sha256}`;
    return this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        assetKey,
      ]);
      await this.storage.put(assetKey, upload.buffer, mimeType);
      return manager.getRepository(AssignmentItemResource).save(
        manager.getRepository(AssignmentItemResource).create({
          itemId,
          kind: AssignmentResourceKind.UPLOAD,
          displayName: dto.displayName,
          assetKey,
          originalFilename: sanitizeFilename(upload.originalname),
          mimeType,
          byteSize: upload.size,
          sha256,
          isActive: true,
          url: null,
          position: dto.position,
        }),
      );
    });
  }

  async createLink(
    ownerUserId: string,
    itemId: string,
    dto: CreateLinkResourceDto,
  ): Promise<AssignmentItemResource> {
    await this.requireWritableItem(ownerUserId, itemId);
    const url = this.normalizeUrl(dto.url, dto.kind);
    return this.resourceRepository.save(
      this.resourceRepository.create({
        itemId,
        kind: dto.kind,
        displayName: dto.displayName,
        url,
        position: dto.position,
        assetKey: null,
        originalFilename: null,
        mimeType: null,
        byteSize: null,
        sha256: null,
        isActive: true,
      }),
    );
  }

  async findAll(
    ownerUserId: string,
    itemId: string,
  ): Promise<AssignmentItemResource[]> {
    await this.requireOwnedItem(ownerUserId, itemId);
    return this.resourceRepository.find({
      where: { itemId, isActive: true },
      order: { position: 'ASC' },
    });
  }

  async getSignedUrl(
    ownerUserId: string,
    resourceId: string,
  ): Promise<{ url: string; expiresInSeconds: number }> {
    const resource = await this.requireOwnedResource(ownerUserId, resourceId);
    if (resource.kind !== AssignmentResourceKind.UPLOAD || !resource.assetKey) {
      throw new BadRequestException('Only uploaded resources have signed URLs');
    }
    return {
      url: await this.storage.getSignedReadUrl(resource.assetKey),
      expiresInSeconds: this.storageConfig.signedUrlTtlSeconds,
    };
  }

  async remove(ownerUserId: string, resourceId: string): Promise<void> {
    const resource = await this.requireWritableResource(
      ownerUserId,
      resourceId,
    );
    const assetKey = resource.assetKey;
    await this.dataSource.transaction(async (manager) => {
      if (assetKey) {
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          assetKey,
        ]);
      }
      await manager.getRepository(AssignmentItemResource).remove(resource);
      const shouldDeleteAsset = assetKey
        ? (await manager
            .getRepository(AssignmentItemResource)
            .countBy({ assetKey })) === 0
        : false;
      if (assetKey && shouldDeleteAsset) {
        await this.storage.delete(assetKey);
      }
    });
  }

  private async requireOwnedItem(
    ownerUserId: string,
    itemId: string,
  ): Promise<StudentAssignmentItem> {
    const item = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.section', 'section')
      .innerJoin('section.assignment', 'assignment')
      .innerJoin('assignment.student', 'student')
      .where('item.id = :itemId', { itemId })
      .andWhere('student.owner_user_id = :ownerUserId', { ownerUserId })
      .getOne();
    if (!item) throw new NotFoundException('Assignment item not found');
    return item;
  }

  private async requireOwnedResource(
    ownerUserId: string,
    resourceId: string,
  ): Promise<AssignmentItemResource> {
    const resource = await this.resourceRepository
      .createQueryBuilder('resource')
      .innerJoin('resource.item', 'item')
      .innerJoin('item.section', 'section')
      .innerJoin('section.assignment', 'assignment')
      .innerJoin('assignment.student', 'student')
      .where('resource.id = :resourceId', { resourceId })
      .andWhere('resource.is_active = true')
      .andWhere('student.owner_user_id = :ownerUserId', { ownerUserId })
      .getOne();
    if (!resource) throw new NotFoundException('Assignment resource not found');
    return resource;
  }

  private async requireWritableItem(
    ownerUserId: string,
    itemId: string,
  ): Promise<StudentAssignmentItem> {
    const item = await this.itemRepository
      .createQueryBuilder('item')
      .innerJoin('item.section', 'section')
      .innerJoin('section.assignment', 'assignment')
      .innerJoin('assignment.student', 'student')
      .where('item.id = :itemId', { itemId })
      .andWhere('student.owner_user_id = :ownerUserId', { ownerUserId })
      .andWhere('student.is_active = true')
      .andWhere('assignment.status = :status', {
        status: StudentAssignmentStatus.DRAFT,
      })
      .getOne();
    if (!item) throw new NotFoundException('Assignment item not found');
    return item;
  }

  private async requireWritableResource(
    ownerUserId: string,
    resourceId: string,
  ): Promise<AssignmentItemResource> {
    const resource = await this.resourceRepository
      .createQueryBuilder('resource')
      .innerJoin('resource.item', 'item')
      .innerJoin('item.section', 'section')
      .innerJoin('section.assignment', 'assignment')
      .innerJoin('assignment.student', 'student')
      .where('resource.id = :resourceId', { resourceId })
      .andWhere('resource.is_active = true')
      .andWhere('student.owner_user_id = :ownerUserId', { ownerUserId })
      .andWhere('student.is_active = true')
      .andWhere('assignment.status = :status', {
        status: StudentAssignmentStatus.DRAFT,
      })
      .getOne();
    if (!resource) throw new NotFoundException('Assignment resource not found');
    return resource;
  }

  private normalizeUrl(value: string, kind: AssignmentResourceKind): string {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException('Resource URL is invalid');
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new BadRequestException(
        'Resource URL must be HTTPS without credentials',
      );
    }
    if (kind === AssignmentResourceKind.YOUTUBE) {
      const host = url.hostname.toLowerCase();
      if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(host)) {
        throw new BadRequestException(
          'YouTube resources must use a YouTube URL',
        );
      }
    }
    url.hash = '';
    return url.toString();
  }
}
