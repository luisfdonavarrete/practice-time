import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isIanaTimeZone', async: false })
export class IsIanaTimeZoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length > 255) return false;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
      return value.includes('/') || value === 'UTC';
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'timeZone must be a valid IANA time zone';
  }
}

export function IsIanaTimeZone(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsIanaTimeZoneConstraint,
    });
  };
}
