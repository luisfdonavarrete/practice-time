import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSession } from './entities/practice-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PracticeSession])],
  exports: [TypeOrmModule],
})
export class PracticeSessionsModule {}
