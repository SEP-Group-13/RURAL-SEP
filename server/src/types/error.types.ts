export abstract class DomainError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class BadRequestError extends DomainError {}
export class DataUnvailableError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ValidationError extends DomainError {}
export class DatabaseError extends DomainError {}