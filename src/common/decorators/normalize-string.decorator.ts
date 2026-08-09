import { Transform } from 'class-transformer';

export interface NormalizeStringOptions {
  trim?: boolean;
  case?: 'lower' | 'upper';
}

export function NormalizeString(
  options: NormalizeStringOptions = {},
): PropertyDecorator {
  return Transform(({ value }: { value: unknown }): unknown => {
    if (typeof value !== 'string') {
      return value;
    }

    let normalizedValue = options.trim ? value.trim() : value;

    if (options.case === 'lower') {
      normalizedValue = normalizedValue.toLowerCase();
    } else if (options.case === 'upper') {
      normalizedValue = normalizedValue.toUpperCase();
    }

    return normalizedValue;
  });
}
