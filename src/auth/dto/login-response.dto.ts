import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LoginResponseDto {
  constructor(accessToken: string) {
    this.access_token = accessToken;
  }

  @Expose()
  access_token: string;
}
