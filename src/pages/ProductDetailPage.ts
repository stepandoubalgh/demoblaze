import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { NavigationHeader } from '../components/NavigationHeader';

/**
 * Product detail page (`prod.html?idp_=<id>`).
 */
export class ProductDetailPage extends BasePage {
  readonly navigationHeader: NavigationHeader;

  constructor(page: Page) {
    super(page);
    this.navigationHeader = new NavigationHeader(page);
  }

  /** @inheritdoc */
  async isLoaded(): Promise<void> {
    await this.assertLoaded(/prod\.html\?idp_=\d+/, this.page.locator('.name'));
  }

  /**
   * Verifies the page has loaded for the expected product by checking
   * both the URL pattern and that the heading matches the given name.
   *
   * @param expectedName product name that should appear in the heading
   */
  async isLoadedFor(expectedName: string): Promise<void> {
    await this.isLoaded();
    await expect(this.page.locator('.name')).toHaveText(expectedName);
  }

  /** Reads the product name currently shown in the page heading. */
  async getProductName(): Promise<string> {
    return (await this.page.locator('.name').textContent())?.trim() ?? '';
  }

  /**
   * Clicks "Add to cart" and asynchronously accepts the confirmation
   * `alert()` dialog the site raises, without any static wait: the
   * dialog handler is registered before the click, and Playwright
   * resolves the click only once the dialog has been dismissed.
   */
  async addToCart(): Promise<void> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.page.getByRole('link', { name: 'Add to cart', exact: true }).click();
    const dialog = await dialogPromise;
    await dialog.accept();
  }
}
