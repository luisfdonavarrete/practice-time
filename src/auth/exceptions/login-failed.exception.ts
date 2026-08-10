export class LoginFailedException extends Error {
  constructor() {
    super(`Email or password is incorrect`);
    this.name = LoginFailedException.name;
  }
}
