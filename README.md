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

# run the UI suite in a visible, maximized window (walkthroughs, debugging)
npm run test:demo

# open the last HTML report
npm run report
```

### Test projects

`playwright.config.ts` defines three projects. `ui` and `api` are what `npm test` and CI run;
`ui-demo` is the same UI suite in a headed, maximized window and is deliberately excluded from
`npm test`. It exists as a separate project rather than a flag because the window size determines
the viewport: `ui` must stay at a fixed 1280x720 so CI runs and failure screenshots are
reproducible on any machine, while a walkthrough wants the whole screen.

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
- **`ui-tests`** runs headless Chromium. **`api-tests`** installs no browser at all: the API suite
  talks to Restful-Booker through Playwright's `request` fixture, a standalone HTTP client, so the
  browser download is dead weight there. Verified rather than assumed - running both suites with an
  empty `PLAYWRIGHT_BROWSERS_PATH` fails the UI suite and passes the API one.
- On failure, the HTML report (and, for UI, traces/screenshots/video from `test-results/`) is
  uploaded as a build artifact with a **30-day retention**.

## Architecture & design decisions

**Page Object Model with explicit page guards.** Every page extends `BasePage`, which exposes a
shared `assertLoaded(urlPattern, anchorLocator)` helper. Each concrete page's `isLoaded()`
verifies both the URL and a key element unique to that page. This gives every navigation step a
reliable, reusable checkpoint instead of ad-hoc assertions scattered through the tests.

Which element a guard anchors on matters more than it looks, and both non-obvious cases here were
settled against the live site rather than by reading the DOM from memory:

- `HomePage` anchors on a product card inside `#tbodyid`, which is fetched asynchronously - not on
  static chrome such as the CATEGORIES sidebar, which ships in the served HTML and is therefore
  present before any content has loaded. A guard on the sidebar passes on an empty page.
- `CartPage` anchors on the static "Products" heading. An empty cart is a legitimate state of that
  page, and an empty `<tbody>` has no box - Playwright reports it as hidden - so a guard on
  `#tbodyid` could never pass on an empty cart. Waiting for the rows themselves belongs to
  `expectOnlyItem()`, which is what actually cares about them.
- `ProductDetailPage` anchors on the `.name` heading, and `isLoadedFor(name)` additionally asserts
  that the heading matches the product the test asked for.

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
- The cart assertion uses Playwright's auto-retrying array form,
  `expect(itemNameCells).toHaveText([productName])`, which polls until both the row count and every
  cell's text match. The cart table renders from an async request the page fires on mount, so a
  one-shot snapshot of the rows could observe a partially rendered table; this cannot.

**Timeouts derived from measurement, not habit.** Demoblaze is deliberately slow, and the budgets
in `playwright.config.ts` come from a Playwright trace of a real run: 17.0 s for the product grid
(`GET /entries`), 33.9 s for a product page (`POST /view`), 35.8 s for `POST /addtocart`, 33.2 s
for `POST /viewcart`. Two consequences follow. The cart renders through a _chain_ of two requests,
so a single assertion there has to survive roughly 70 s - at a 60 s expect timeout it failed with
the second request still in flight. And one purchase scenario adds up to about 155 s of pure
waiting, so the per-test ceiling has to clear that with room to spare. Hence `timeout: 300_000` and
`expect: { timeout: 120_000 }`, with the measurements recorded next to them in the config. Raising
these does not slow the suite down in the good case: a timeout is a ceiling, never a delay - every
wait in this project is an auto-retrying assertion that resolves the moment the data arrives.

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

The test account's email identifies the row in every query below, so it is set once as a psql
variable rather than repeated as a literal - the value changes per test run, the queries do not:

```sql
\set test_email 'milena.stranska@example.com'
```

Run from test code rather than from `psql`, the same queries take it as a bound parameter (`$1`),
which is both the same idea and the reason no test data ever gets concatenated into SQL.

### Cleanup: delete a test customer and their bookings

Child rows (`bookings`) are deleted before the parent (`customers`) row to respect the
`customer_id` foreign key:

```sql
DELETE FROM bookings
WHERE customer_id = (
  SELECT id FROM customers WHERE email = :'test_email'
);

DELETE FROM customers
WHERE email = :'test_email';
```

(Equivalently, if the `bookings.customer_id` foreign key is defined with `ON DELETE CASCADE`, the
single `DELETE FROM customers ...` statement is enough.)

### Verify a newly registered user's address (JOIN)

```sql
SELECT u.id, u.firstname, u.lastname, a.street, a.city, a.postal_code, a.country
FROM users u
JOIN addresses a ON a.user_id = u.id
WHERE u.email = :'test_email';
```
