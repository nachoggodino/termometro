import { expect, test } from "@playwright/test";

test("captures primary surfaces", async ({ page }, testInfo) => {
  const project = testInfo.project.name;

  await page.goto("/es");
  await expect(page.getByText("Termo de Madrid").first()).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-home.png` });

  await page.goto("/es/reportar");
  await expect(page.getByRole("heading", { name: "Reportar calor" })).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-reportar.png` });

  await page.goto("/es/explorar");
  await expect(page.getByText("Evolución de cada línea")).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-explorar.png` });
});
