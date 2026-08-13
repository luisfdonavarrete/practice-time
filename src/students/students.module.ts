import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentUser } from './entities/student-user.entity';
import { StudentUserService } from './student-user.service';
import { StudentAccessPolicyService } from './policies/student-access-policy.service';

@Module({
  imports: [TypeOrmModule.forFeature([Student, StudentUser])],
  controllers: [StudentsController],
  providers: [StudentsService, StudentUserService, StudentAccessPolicyService],
  exports: [StudentAccessPolicyService],
})
export class StudentsModule {}
