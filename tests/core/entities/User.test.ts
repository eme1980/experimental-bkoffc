import { describe, it, expect } from 'vitest';
import { User } from '../../../src/core/entities/User';

describe('User Entity', () => {
  it('should create a user with a valid email and password', () => {
    const user = new User('test@example.com', 'Password123!');
    expect(user.email).toBe('test@example.com');
  });

  it('should throw an error if the email is invalid', () => {
    expect(() => new User('invalid-email', 'Password123!')).toThrow('Invalid email format');
  });

  it('should throw an error if the password is too short', () => {
    expect(() => new User('test@example.com', '123')).toThrow('Password too short');
  });
});
