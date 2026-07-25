import { Test, TestingModule } from '@nestjs/testing';
import { StudentAssignmentsService } from './student-assignments.service';

describe('StudentAssignmentsService', () => {
  let service: StudentAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentAssignmentsService],
    }).compile();

    service = module.get<StudentAssignmentsService>(StudentAssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
