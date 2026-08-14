import 'reflect-metadata';
import { AssignmentResourcesService } from './assignment-resources.service';

describe('AssignmentResourcesService', () => {
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const resourceRepository = {
    create: jest.fn((value: unknown) => value),
    save: jest.fn(),
    remove: jest.fn(),
    countBy: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const itemRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const storage = {
    put: jest.fn(),
    delete: jest.fn(),
    getSignedReadUrl: jest.fn(),
  };
  const manager = {
    query: jest.fn(),
    getRepository: jest.fn(() => resourceRepository),
  };
  const dataSource = {
    transaction: jest.fn((work: (value: typeof manager) => unknown) =>
      work(manager),
    ),
  };
  const service = new AssignmentResourcesService(
    resourceRepository as never,
    itemRepository as never,
    dataSource as never,
    storage as never,
    { maxUploadBytes: 1024, signedUrlTtlSeconds: 300 } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('does not upload when the current user does not own the item', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.createUpload(
        'other-owner',
        'item-id',
        { displayName: 'Score', position: 0 },
        {
          buffer: Buffer.from('%PDF-1.7'),
          size: 8,
          mimetype: 'application/pdf',
          originalname: 'score.pdf',
        } as Express.Multer.File,
      ),
    ).rejects.toThrow('not found');
    expect(storage.put).not.toHaveBeenCalled();
    expect(resourceRepository.save).not.toHaveBeenCalled();
  });

  it('does not create an active resource when object storage fails', async () => {
    queryBuilder.getOne.mockResolvedValue({ id: 'item-id' });
    storage.put.mockRejectedValue(new Error('S3 unavailable'));

    await expect(
      service.createUpload(
        'owner-id',
        'item-id',
        { displayName: 'Score', position: 0 },
        {
          buffer: Buffer.from('%PDF-1.7'),
          size: 8,
          mimetype: 'application/pdf',
          originalname: 'score.pdf',
        } as Express.Multer.File,
      ),
    ).rejects.toThrow('S3 unavailable');
    expect(resourceRepository.save).not.toHaveBeenCalled();
  });

  it('does not expose a signed URL across ownership boundaries', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.getSignedUrl('other-owner', 'resource-id'),
    ).rejects.toThrow('not found');
    expect(storage.getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('keeps a shared object while another resource still references it', async () => {
    queryBuilder.getOne.mockResolvedValue({
      id: 'resource-id',
      assetKey: 'assignment-resources/hash',
      isActive: true,
    });
    resourceRepository.countBy.mockResolvedValue(1);

    await service.remove('owner-id', 'resource-id');

    expect(resourceRepository.remove).toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
});
