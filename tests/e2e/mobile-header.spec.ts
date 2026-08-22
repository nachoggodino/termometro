import { expect, test } from "@playwright/test";

test("mobile header hides on downward scroll and returns on upward scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/es/explorar");
  await page.waitForLoadState("networkidle");

  const header = page.getByTestId("app-header");
  const utilityBar = page.getByTestId("sticky-utility-bar");

  await expect(header).toHaveAttribute("data-hidden", "false");
  await expect.poll(() => utilityBar.evaluate((element) => getComputedStyle(element).top)).toBe("72px");

  await page.evaluate(() => window.scrollTo(0, 700));
  await expect(header).toHaveAttribute("data-hidden", "true");
  await expect.poll(() => utilityBar.evaluate((element) => getComputedStyle(element).top)).toBe("0px");

  await page.evaluate(() => window.scrollBy(0, -60));
  await expect(header).toHaveAttribute("data-hidden", "false");
  await expect.poll(() => utilityBar.evaluate((element) => getComputedStyle(element).top)).toBe("72px");
});

test("theme color follows the in-app theme instead of the system theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/es");
  await page.waitForLoadState("networkidle");

  const themeColor = page.locator('meta[name="theme-color"]');
  await expect(themeColor).toHaveAttribute("content", "#fdfaf1");

  await page.getByRole("button", { name: "Menú" }).click();
  await page.getByTestId("theme-toggle").getByRole("button", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(themeColor).toHaveAttribute("content", "#010a19");

  await page.getByTestId("theme-toggle").getByRole("button", { name: "Claro" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(themeColor).toHaveAttribute("content", "#fdfaf1");
});
