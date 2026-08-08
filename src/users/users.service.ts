import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

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
    return this.userRepository.save(user);
  }

  async doesEmailExist(email: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ email });
    return !!user;
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
