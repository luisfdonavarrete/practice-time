import {
  isEmail,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';
import { UsersService } from '../users.service';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'IsEmailUnique', async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  async validate(value: unknown): Promise<boolean> {
    if (typeof value !== 'string' || !isEmail(value)) {
      return true;
    }

    const doesEmailExist = await this.usersService.doesEmailExist(value);
    return !doesEmailExist;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} is already in use`;
  }
}

export function IsEmailUnique(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [],
      options: validationOptions,
      validator: IsEmailUniqueConstraint,
    });
  };
}
