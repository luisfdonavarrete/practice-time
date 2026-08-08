import { UserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { plainToClass } from 'class-transformer';

export class UserResponseMapper {
  static toDto(user: User): UserDto {
    return plainToClass(UserDto, user);
  }

  static toDtoList(users: User[]): UserDto[] {
    return users.map((user) => this.toDto(user));
  }
}
