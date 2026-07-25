import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentAssignmentsModule } from './student-assignments/student-assignments.module';

@Module({
  imports: [StudentAssignmentsModule],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {}
