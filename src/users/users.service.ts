import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DuplicateEmailException } from './exceptions/duplicate-email.exception';
import { HashingService } from '../hashing/hashing.service';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const password = await this.hashingService.hashing(createUserDto.password);
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

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    await this.userRepository.update(id, updateUserDto);
    return (await this.userRepository.findOneBy({ id })) as User;
  }
}
