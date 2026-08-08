export class DuplicateEmailException extends Error {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
    this.name = DuplicateEmailException.name;
  }
}
