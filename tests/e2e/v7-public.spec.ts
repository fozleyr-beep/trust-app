import { expect, test } from "@playwright/test";

for (const path of ["/", "/trust", "/for-families"] as const) {
  test(`${path} renders RTL when Arabic locale is selected`, async ({ page }) => {
    await page.context().addCookies([
      {
        name: "NEXT_LOCALE",
        value: "ar",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("body")).toBeVisible();
  });
}

test("unauthenticated direct photo fetch is denied", async ({ request }) => {
  const response = await request.get("/api/photos/example");
  expect(response.status()).toBe(403);
});
