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
          const hasAssetKey =
            typeof resource.assetKey === 'string' &&
            resource.assetKey.trim().length > 0;
          const hasHttpsUrl =
            typeof resource.url === 'string' &&
            isURL(resource.url, {
              protocols: ['https'],
              require_protocol: true,
            });

          return resource.kind === AssignmentResourceKind.UPLOAD
            ? hasAssetKey && resource.url === undefined
            : !hasAssetKey && hasHttpsUrl;
        },
        defaultMessage(): string {
          return 'upload resources require only assetKey; link resources require only an HTTPS url';
        },
      },
    });
  };
}
