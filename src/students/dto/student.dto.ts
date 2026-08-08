import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StudentDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  dateOfBirth: Date;
}
