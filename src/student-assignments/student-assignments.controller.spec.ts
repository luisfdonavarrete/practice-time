import { Test, TestingModule } from '@nestjs/testing';
import { StudentAssignmentsController } from './student-assignments.controller';
import { StudentAssignmentsService } from './student-assignments.service';

describe('StudentAssignmentsController', () => {
  let controller: StudentAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentAssignmentsController],
      providers: [StudentAssignmentsService],
    }).compile();

    controller = module.get<StudentAssignmentsController>(StudentAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
