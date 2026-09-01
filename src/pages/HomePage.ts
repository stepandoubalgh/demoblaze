import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductDetailPage } from './ProductDetailPage';
import { NavigationHeader } from '../components/NavigationHeader';

/**
 * Demoblaze store home page (product grid / landing page).
 */
export class HomePage extends BasePage {
  readonly navigationHeader: NavigationHeader;

  constructor(page: Page) {
    super(page);
    this.navigationHeader = new NavigationHeader(page);
  }

  /** Navigates to the home page. */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.isLoaded();
  }

  /** @inheritdoc */
  async isLoaded(): Promise<void> {
    await this.assertLoaded(/\/(index\.html)?$/, this.page.getByText('CATEGORIES'));
  }

  /**
   * Dynamically locates a product card in the grid by its visible name
   * and clicks it, without hard-coding row/column indexes.
   *
   * @param productName exact product name as shown on the home page card
   * @returns a {@link ProductDetailPage} once the click has been issued
   */
  async selectProduct(productName: string): Promise<ProductDetailPage> {
    const productLink = this.page.getByRole('link', { name: productName, exact: true });
    await expect(productLink).toBeVisible();
    await productLink.click();
    return new ProductDetailPage(this.page);
  }
}
