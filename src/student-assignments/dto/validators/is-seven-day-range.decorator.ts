import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function IsSevenDayRange(
  startDateProperty: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isSevenDayRange',
      target: object.constructor,
      propertyName,
      constraints: [startDateProperty],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [startProperty] = args.constraints as [string];
          const start = (args.object as Record<string, unknown>)[startProperty];
          if (
            typeof start !== 'string' ||
            typeof value !== 'string' ||
            !LOCAL_DATE_PATTERN.test(start) ||
            !LOCAL_DATE_PATTERN.test(value)
          ) {
            return true;
          }

          const startTime = Date.parse(`${start}T00:00:00.000Z`);
          const endTime = Date.parse(`${value}T00:00:00.000Z`);
          return endTime - startTime === 6 * DAY_IN_MILLISECONDS;
        },
        defaultMessage(args: ValidationArguments): string {
          const [startProperty] = args.constraints as [string];
          return `${args.property} must be six calendar days after ${startProperty}`;
        },
      },
    });
  };
}
