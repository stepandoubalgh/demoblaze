import type { Locator, Page } from '@playwright/test';

/**
 * Shared navigation bar present on every Demoblaze page.
 *
 * Modeled as a component rather than a page, since it is not tied to a
 * single URL/isLoaded contract - it is reused across HomePage,
 * ProductDetailPage and CartPage alike.
 */
export class NavigationHeader {
  private readonly page: Page;
  private readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartLink = page.getByRole('link', { name: 'Cart', exact: true });
  }

  /**
   * Navigates to the cart page via the main nav bar and waits for the
   * SPA-style route change to settle.
   */
  async goToCart(): Promise<void> {
    await this.cartLink.click();
    await this.page.waitForURL(/cart\.html/);
  }
}
