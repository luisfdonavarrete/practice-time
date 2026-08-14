import { ApiProperty } from '@nestjs/swagger';

export class AssignmentItemCompletionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  itemId: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty({ format: 'date-time' })
  completedAt: string;
}
