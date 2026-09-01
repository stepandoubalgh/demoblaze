import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Common contract and shared helpers for every Page Object.
 *
 * Each concrete page must implement a "page guard" (`isLoaded`) that
 * asserts both the URL and the presence of a key UI element before any
 * further interaction happens. This removes the need for static sleeps:
 * navigation methods can simply await the guard instead of an arbitrary
 * timeout.
 */
export abstract class BasePage {
  protected readonly page: Page;

  protected constructor(page: Page) {
    this.page = page;
  }

  /**
   * Verifies that the browser is on this page: correct URL plus a
   * locator that only exists once the page has actually rendered.
   * Concrete pages must call {@link BasePage.assertLoaded} with their
   * own URL pattern and anchor locator.
   */
  abstract isLoaded(): Promise<void>;

  /**
   * Shared assertion used by every page guard: waits for the URL to
   * match and for the anchor locator to become visible. Both waits are
   * dynamic (Playwright auto-retrying assertions), so no fixed delays
   * are ever needed.
   */
  protected async assertLoaded(urlPattern: RegExp, anchor: Locator): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
    await expect(anchor).toBeVisible();
  }
}
