import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StudentDto {
  @Expose()
  id: string;

  @Expose()
  first_name: string;

  @Expose()
  last_name: string;

  @Expose()
  dateOfBirth: Date;
}
