import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { DuplicateEmailException } from './exceptions/duplicate-email.exception';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const password = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password,
    });
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code ===
          POSTGRES_UNIQUE_VIOLATION_CODE
      ) {
        throw new DuplicateEmailException(createUserDto.email);
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<User> {
    return await this.userRepository.findOneOrFail({
      where: {
        id,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    await this.userRepository.update(id, updateUserDto);
    return (await this.userRepository.findOneBy({ id })) as User;
  }
}
