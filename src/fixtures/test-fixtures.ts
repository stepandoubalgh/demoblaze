import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { BookingApiClient } from '../api/BookingApiClient';

/**
 * Custom fixtures extending the base Playwright `test`.
 *
 * Fixtures are lazily instantiated: a UI spec that only asks for
 * `homePage` never triggers `bookingApiClient` construction and vice
 * versa, so the same fixture file can safely serve both the `ui` and
 * `api` Playwright projects without either one paying for the other's
 * setup.
 */
interface TestFixtures {
  homePage: HomePage;
  bookingApiClient: BookingApiClient;
}

export const test = base.extend<TestFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  bookingApiClient: async ({ request }, use) => {
    await use(new BookingApiClient(request));
  },
});

export { expect } from '@playwright/test';
