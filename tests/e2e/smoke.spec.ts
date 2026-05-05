import { expect, test } from "@playwright/test";

test("public trust surface renders", async ({ page }) => {
  await page.goto("/trust");
  await expect(page.getByRole("heading", { name: /trust/i })).toBeVisible();
});
