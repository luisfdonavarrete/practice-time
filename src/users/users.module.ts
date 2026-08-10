import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { HashingModule } from '../hashing/hashing.module';
import { UserResponseMapper } from './mappers/user-response.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([User]), HashingModule],
  controllers: [UsersController],
  providers: [UsersService, UserResponseMapper],
  exports: [UsersService, UserResponseMapper],
})
export class UsersModule {}
