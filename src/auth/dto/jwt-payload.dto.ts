export interface JwtPayloadDto {
  sub: string;
  iat?: number;
  exp?: number;
}
