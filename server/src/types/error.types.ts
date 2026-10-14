export abstract class DomainError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class ValidationError extends DomainError {}
export class EmailAlreadyInUseError extends DomainError {}
export class UserNotFoundError extends DomainError {}
export class InvalidCredentialsError extends DomainError {}
export class DatabaseError extends DomainError {}
export class UnauthorizedError extends DomainError {}
export class InvalidUserError extends DomainError {}
export class EventNotFoundError extends DomainError {}