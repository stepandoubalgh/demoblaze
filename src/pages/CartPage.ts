import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { NavigationHeader } from '../components/NavigationHeader';

/**
 * Shopping cart page (`cart.html`).
 */
export class CartPage extends BasePage {
  readonly navigationHeader: NavigationHeader;

  constructor(page: Page) {
    super(page);
    this.navigationHeader = new NavigationHeader(page);
  }

  /** @inheritdoc */
  async isLoaded(): Promise<void> {
    await this.assertLoaded(/cart\.html/, this.page.locator('#tbodyid'));
  }

  /**
   * Reads the product names currently listed in the cart table body.
   * Waits for at least one row to exist so callers never race the
   * async cart-loading request the page fires on mount.
   */
  async getCartItemNames(): Promise<string[]> {
    const rows = this.page.locator('#tbodyid tr');
    await expect(rows.first()).toBeVisible();
    return rows.locator('td:nth-child(2)').allTextContents();
  }

  /**
   * Asserts the cart contains exactly one row, and that it is the
   * given product.
   *
   * @param productName expected product name in the single cart row
   */
  async expectOnlyItem(productName: string): Promise<void> {
    const itemNames = await this.getCartItemNames();
    expect(itemNames).toEqual([productName]);
  }
}
