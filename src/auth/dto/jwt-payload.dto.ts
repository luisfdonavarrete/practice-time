export class JwtPayloadDto {
  iss?: string; // to do - add issuer
  exp?: string; // to do - add expiration date
  sub: string;
  aud?: string; // to do - add audience
}
