import {
  isURL,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { AssignmentResourceKind } from '../../entities/assignment-item-resource.entity';

export function HasValidResourceSource(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'hasValidResourceSource',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const resource = args.object as {
            kind?: AssignmentResourceKind;
            assetKey?: unknown;
            url?: unknown;
          };
          const hasHttpsUrl =
            typeof resource.url === 'string' &&
            isURL(resource.url, {
              protocols: ['https'],
              require_protocol: true,
            });

          return resource.kind === AssignmentResourceKind.UPLOAD
            ? false
            : resource.assetKey === undefined && hasHttpsUrl;
        },
        defaultMessage(): string {
          return 'uploaded files must use the upload endpoint; link resources require an HTTPS url';
        },
      },
    });
  };
}
