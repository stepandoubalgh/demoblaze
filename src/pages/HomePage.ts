import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductDetailPage } from './ProductDetailPage';
import { NavigationHeader } from '../components/NavigationHeader';

/**
 * Demoblaze store home page (product grid / landing page).
 */
export class HomePage extends BasePage {
  readonly navigationHeader: NavigationHeader;

  /** Product cards rendered into the grid by the page's asynchronous load. */
  private readonly productCards: Locator;

  constructor(page: Page) {
    super(page);
    this.navigationHeader = new NavigationHeader(page);
    this.productCards = page.locator('#tbodyid a[href^="prod.html"]');
  }

  /** Navigates to the home page. */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.isLoaded();
  }

  /**
   * @inheritdoc
   *
   * Anchors on a product card rather than on static page chrome such as
   * the CATEGORIES sidebar. The sidebar ships in the served HTML and is
   * therefore present before any content has loaded, so guarding on it
   * would pass on an empty page; the product grid is fetched
   * asynchronously and rendered into `#tbodyid`. Waiting for a card means
   * the guard only passes once the page is genuinely usable.
   */
  async isLoaded(): Promise<void> {
    await this.assertLoaded(/\/(index\.html)?$/, this.productCards.first());
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
