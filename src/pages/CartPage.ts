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

  /** Static page heading, served with cart.html regardless of cart contents. */
  private readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.navigationHeader = new NavigationHeader(page);
    this.itemNameCells = page.locator('#tbodyid tr td:nth-child(2)');
    this.heading = page.getByRole('heading', { name: 'Products', exact: true });
  }

  /**
   * @inheritdoc
   *
   * Anchors on the static "Products" heading rather than on the `#tbodyid`
   * table body. Two reasons, and they point the same way:
   *
   * 1. An empty cart is a legitimate state of this page, so a guard that only
   *    passes once rows exist would be asserting the wrong thing.
   * 2. `#tbodyid` is an empty `<tbody>` until the rows arrive, and an empty
   *    element has no box — Playwright reports it as hidden, so the guard
   *    could never pass on an empty cart at all.
   *
   * Waiting for the rows themselves belongs to
   * {@link CartPage.expectOnlyItem}, which is what actually cares about them.
   */
  async isLoaded(): Promise<void> {
    await this.assertLoaded(/cart\.html/, this.heading);
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
