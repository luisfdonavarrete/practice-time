import { plainToInstance } from 'class-transformer';
import { PracticeSessionResponseDto } from './dto/practice-session-response.dto';
import { PracticeSession } from './entities/practice-session.entity';

export class PracticeSessionMapper {
  static toDto(session: PracticeSession): PracticeSessionResponseDto {
    return plainToInstance(PracticeSessionResponseDto, session, {
      excludeExtraneousValues: true,
    });
  }
}
