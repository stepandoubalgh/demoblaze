# Hybrid E2E Automation

Playwright + TypeScript automation framework combining a UI end-to-end purchase flow on
[Demoblaze](https://www.demoblaze.com/) with an API integration test against
[Restful-Booker](https://restful-booker.herokuapp.com), plus a GitHub Actions CI pipeline.

Built for the Quadient "Software Test Engineer (Hybrid E2E Automation & CI/CD)" assignment
(see [`docs/test_engineer_assignment.pdf`](docs/test_engineer_assignment.pdf) for the original brief).

## Project structure

```
src/
  pages/            Page Objects (BasePage, HomePage, ProductDetailPage, CartPage)
  components/        Reusable UI components (NavigationHeader)
  api/               Typed API client (BookingApiClient)
  models/            TypeScript interfaces for API request/response contracts
  fixtures/          Custom Playwright fixtures wiring pages & API client into tests
tests/
  ui/                Demoblaze purchase-flow end-to-end tests
  api/                Restful-Booker integration tests
.github/workflows/    CI pipeline (GitHub Actions)
docs/                 Original assignment
```

## Prerequisites

- Node.js 20+
- npm

## Installation

```bash
npm install
npx playwright install --with-deps chromium
```

## Running the tests

```bash
# run everything (ui + api projects)
npm test

# run only the UI suite
npm run test:ui

# run only the API suite
npm run test:api

# open the last HTML report
npm run report
```

Useful during development:

```bash
npx playwright test --headed        # watch the browser
npx playwright test --debug         # step through with the Playwright inspector
npx playwright test --ui            # Playwright's interactive UI mode
```

### Linting & formatting

```bash
npm run lint           # ESLint
npm run format:check   # Prettier check
npm run format          # Prettier write
```

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

- **`ui-tests`** and **`api-tests`** run as two separate jobs (matching the `ui`/`api` Playwright
  projects defined in `playwright.config.ts`), so UI and API runs are isolated and can execute in
  parallel.
- Both jobs run **headless Chromium**.
- On failure, the HTML report (and, for UI, traces/screenshots/video from `test-results/`) is
  uploaded as a build artifact with a **30-day retention**.

## Architecture & design decisions

**Page Object Model with explicit page guards.** Every page extends `BasePage`, which exposes a
shared `assertLoaded(urlPattern, anchorLocator)` helper. Each concrete page's `isLoaded()`
verifies both the URL and a key element unique to that page (e.g. the `.name` heading on the
product detail page, the `#tbodyid` cart table on the cart page). This gives every navigation
step a reliable, reusable checkpoint instead of ad-hoc assertions scattered through the tests.

**Shared component vs. page.** `NavigationHeader` is modeled as a component, not a page: it has
no URL/`isLoaded` contract of its own and is composed into `HomePage`, `ProductDetailPage` and
`CartPage` alike, avoiding duplication of the "go to cart" / "go home" logic.

**No static sleeps.** All waiting is event- or state-driven:

- Product selection and cart verification rely on Playwright's auto-retrying locators/assertions
  (`expect(locator).toBeVisible()`, `toHaveText()`, `toHaveURL()`), which poll until the condition
  is true or the test times out - never a fixed delay.
- The "Add to cart" confirmation `alert()` is handled by registering
  `page.waitForEvent('dialog')` **before** clicking the button, then `await`-ing the resulting
  promise. This is inherently asynchronous and race-free: the click and the dialog handshake are
  awaited together rather than assumed to happen within some guessed timeout.
- Cart-content reads wait on the first row locator to become visible before reading all rows,
  covering the async client-side render of the cart table.

**Typed API layer.** `BookingApiClient` wraps Playwright's built-in `APIRequestContext`
(`request` fixture) and returns typed results via the `BookingData` / `CreateBookingResponse` /
`GetBookingResponse` interfaces in `src/models/booking.model.ts`, so request payloads and response
shapes are checked at compile time, not just at runtime by test assertions.

**Fixtures over manual wiring.** `src/fixtures/test-fixtures.ts` extends Playwright's `test` with
`homePage` and `bookingApiClient` fixtures. Fixtures are lazily instantiated, so a UI spec that
only requests `homePage` never pays for constructing the API client and vice versa - the same
fixture file safely serves both the `ui` and `api` projects.

**Dynamic product selection.** The UI purchase-flow test is parameterized over a small list of
product names (`Samsung galaxy s6`, `Nokia lumia 1520`) and locates each one in the grid by its
visible text at runtime (`page.getByRole('link', { name: productName })`), rather than hard-coding
a grid position - the same spec exercises multiple products without duplicated test code.

## SQL (Part 4)

Schema assumed:

- `customers(id, firstname, lastname, email)`
- `bookings(id, customer_id, total_price, deposit_paid)`
- `users(id, ...)` / `addresses(user_id, ...)` for the address-verification query

### Cleanup: delete a test customer and their bookings

Child rows (`bookings`) are deleted before the parent (`customers`) row to respect the
`customer_id` foreign key:

```sql
DELETE FROM bookings
WHERE customer_id = (
  SELECT id FROM customers WHERE email = 'milena.stranska@example.com'
);

DELETE FROM customers
WHERE email = 'milena.stranska@example.com';
```

(Equivalently, if the `bookings.customer_id` foreign key is defined with `ON DELETE CASCADE`, the
single `DELETE FROM customers ...` statement is enough.)

### Verify a newly registered user's address (JOIN)

```sql
SELECT u.id, u.firstname, u.lastname, a.street, a.city, a.postal_code, a.country
FROM users u
JOIN addresses a ON a.user_id = u.id
WHERE u.email = 'milena.stranska@example.com';
```
