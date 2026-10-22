import { randomUUID } from 'node:crypto';

export interface NewUser {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  postalCode: string;
  houseNumber: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  password: string;
}

const FIRST_NAMES = ['Alice', 'Brian', 'Chloe', 'Daniel', 'Emma', 'Felix', 'Grace', 'Henry'];
const LAST_NAMES = ['Anderson', 'Brooks', 'Carter', 'Dawson', 'Ellis', 'Foster', 'Graham', 'Hayes'];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export class UserFactory {
  static create(overrides: Partial<NewUser> = {}): NewUser {
    const unique = randomUUID().replace(/-/g, '').slice(0, 12);

    return {
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      dateOfBirth: '1995-06-15',
      // A real address: checkout validates that the city belongs to the country,
      // and made-up cities pass only intermittently.
      street: 'Broadway',
      postalCode: '10001',
      houseNumber: '12',
      city: 'New York',
      state: 'NY',
      country: 'US',
      phone: '5551234567',
      email: `qa.${unique}@example.com`,
      // upper + lower + digit + symbol, 14 chars: covers typical complexity rules
      password: `Aa1!${unique}`,
      ...overrides,
    };
  }
}
