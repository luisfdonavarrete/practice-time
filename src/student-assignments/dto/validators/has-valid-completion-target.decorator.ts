import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { AssignmentCompletionMode } from '../../entities/student-assignment-item.entity';

export function HasValidCompletionTarget(
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'hasValidCompletionTarget',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const item = args.object as {
            completionMode?: AssignmentCompletionMode;
            suggestedPracticeDays?: unknown;
          };
          if (item.completionMode === AssignmentCompletionMode.ONE_TIME) {
            return item.suggestedPracticeDays === undefined;
          }
          if (item.completionMode === AssignmentCompletionMode.PRACTICE_DAYS) {
            return (
              Number.isInteger(item.suggestedPracticeDays) &&
              Number(item.suggestedPracticeDays) >= 1 &&
              Number(item.suggestedPracticeDays) <= 7
            );
          }
          return true;
        },
        defaultMessage(): string {
          return 'suggestedPracticeDays must be 1-7 for practice-days items and omitted for one-time items';
        },
      },
    });
  };
}
