import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { NavigationHeader } from '../components/NavigationHeader';

/**
 * Shopping cart page (`cart.html`).
 */
export class CartPage extends BasePage {
  readonly navigationHeader: NavigationHeader;

  /** Product-name cell of every row currently in the cart table. */
  private readonly itemNameCells: Locator;

  constructor(page: Page) {
    super(page);
    this.navigationHeader = new NavigationHeader(page);
    this.itemNameCells = page.locator('#tbodyid tr td:nth-child(2)');
  }

  /** @inheritdoc */
  async isLoaded(): Promise<void> {
    await this.assertLoaded(/cart\.html/, this.page.locator('#tbodyid'));
  }

  /**
   * Asserts the cart contains exactly one row, and that it is the given
   * product.
   *
   * Uses Playwright's auto-retrying array assertion, which polls until
   * both the row count and every cell's text match. The cart table is
   * rendered from an async request the page fires on mount, so a
   * one-shot snapshot of the rows could observe a partially rendered
   * table; this cannot.
   *
   * @param productName expected product name in the single cart row
   */
  async expectOnlyItem(productName: string): Promise<void> {
    await expect(this.itemNameCells).toHaveText([productName]);
  }
}
