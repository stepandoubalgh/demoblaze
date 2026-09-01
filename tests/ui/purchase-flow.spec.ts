import { test, expect } from '../../src/fixtures/test-fixtures';
import { CartPage } from '../../src/pages/CartPage';

/**
 * Products the purchase flow is exercised against. Kept as data rather
 * than hard-coded per test so the same scenario can be driven for any
 * product the grid exposes.
 */
const PRODUCTS_TO_PURCHASE = ['Samsung galaxy s6', 'Nokia lumia 1520'];

for (const productName of PRODUCTS_TO_PURCHASE) {
  test.describe(`Purchase flow - ${productName}`, () => {
    test(`adds "${productName}" to the cart and verifies it end to end`, async ({ page, homePage }) => {
      await test.step('Open the store home page', async () => {
        await homePage.goto();
        await expect(page).toHaveURL(/demoblaze\.com\/?(index\.html)?$/);
      });

      const productDetailPage = await test.step(`Select "${productName}" from the product grid`, async () => {
        const detailPage = await homePage.selectProduct(productName);
        await detailPage.isLoadedFor(productName);
        return detailPage;
      });

      await test.step('Add the product to the cart, accepting the confirmation dialog', async () => {
        await productDetailPage.addToCart();
      });

      const cartPage = await test.step('Navigate to the cart via the main navigation', async () => {
        await productDetailPage.navigationHeader.goToCart();
        const cart = new CartPage(page);
        await cart.isLoaded();
        return cart;
      });

      await test.step('Verify the cart contains exactly the purchased product', async () => {
        await cartPage.expectOnlyItem(productName);
      });
    });
  });
}
