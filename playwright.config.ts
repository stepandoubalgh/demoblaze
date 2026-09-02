import { defineConfig, devices } from '@playwright/test';

/** Browser setup shared by every UI project. */
const uiUse = {
  ...devices['Desktop Chrome'],
  baseURL: 'https://www.demoblaze.com',
};

export default defineConfig({
  testDir: './tests',

  /**
   * Demoblaze's response time varies by more than an order of magnitude, so
   * these budgets are sized for the slow end rather than the typical one.
   *
   * A Playwright trace of one run measured:
   *
   *   GET  /entries    (product grid)     17.0 s
   *   POST /view       (product page)     33.9 s
   *   POST /addtocart                     35.8 s
   *   POST /viewcart                      33.2 s
   *   POST /view       (cart row)        ~34   s
   *
   * That is ~155 s of pure waiting for one scenario, or 2.7 min per test. The
   * same suite on the same machine later ran at 13 s per test, and takes ~6 s
   * on a GitHub runner. The spread is the constraint, not any single number.
   *
   * Two consequences drive the values below. First, the cart renders through
   * a *chain* of two requests — `viewcart`, and only then a `view` per item —
   * so a single assertion there has to survive roughly 70 s. That is why the
   * expect timeout is what it is; at 60 s the cart assertion failed with the
   * second request still in flight. Second, the per-test ceiling has to clear
   * that ~155 s worst case with room to spare.
   *
   * Sizing for the bad case costs nothing in the good one: every wait in this
   * project is an auto-retrying Playwright assertion that resolves the moment
   * the data arrives, which is why the same config still finishes in seconds
   * when the site is responsive. A timeout is a ceiling, never a delay — there
   * is not a single static sleep in the codebase.
   */
  timeout: 300_000,
  expect: { timeout: 120_000 },

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testMatch: /ui\/.*\.spec\.ts/,
      use: uiUse,
    },
    {
      /**
       * The same UI suite in a visible, maximized window — for demoing the
       * framework and for watching a failure as it happens.
       *
       * This is a separate project rather than a flag on `ui` because the
       * window size determines the viewport: `ui` must stay at a fixed
       * 1280x720 so that CI runs and failure screenshots are reproducible on
       * any machine, while a demo wants the whole screen. Note that a config
       * cannot detect `--headed` on its own — Playwright re-evaluates this
       * file inside each worker process, and workers are spawned without the
       * CLI arguments.
       *
       * Deliberately excluded from `npm test`; run it with `npm run test:demo`.
       */
      name: 'ui-demo',
      testMatch: /ui\/.*\.spec\.ts/,
      use: {
        ...uiUse,
        headless: false,
        // `viewport: null` hands sizing over to the real window, which is what
        // `--start-maximized` then fills. The device preset's fixed
        // `deviceScaleFactor` has to be dropped, as Playwright rejects the two
        // together.
        viewport: null,
        deviceScaleFactor: undefined,
        launchOptions: { args: ['--start-maximized'] },
      },
    },
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: { baseURL: 'https://restful-booker.herokuapp.com' },
    },
  ],
});
