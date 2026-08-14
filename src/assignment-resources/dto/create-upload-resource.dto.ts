import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';

export class CreateUploadResourceDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  file?: unknown;

  @NormalizeString({ trim: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(0)
  position: number;
}
