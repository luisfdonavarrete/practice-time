import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeString } from '../../common/decorators/normalize-string.decorator';
import { CreateAssignmentItemDto } from './create-assignment-item.dto';

export class CreateAssignmentSectionDto {
  @NormalizeString({ trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsInt()
  @Min(0)
  position: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: CreateAssignmentItemDto) => item.position)
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentItemDto)
  items: CreateAssignmentItemDto[];
}
