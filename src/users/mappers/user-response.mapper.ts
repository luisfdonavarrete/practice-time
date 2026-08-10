import { UserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserResponseMapper {
  toDto(user: User): UserDto {
    return plainToInstance(UserDto, user);
  }

  toDtoList(users: User[]): UserDto[] {
    return users.map((user) => this.toDto(user));
  }
}
