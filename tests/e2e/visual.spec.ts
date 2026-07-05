import { test } from "@playwright/test";

test("captures primary surfaces", async ({ page }, testInfo) => {
  const project = testInfo.project.name;

  await page.goto("/es");
  await page.screenshot({ fullPage: true, path: `/tmp/termometro-${project}-home.png` });

  await page.goto("/es/reportar");
  await page.screenshot({ fullPage: true, path: `/tmp/termometro-${project}-reportar.png` });

  await page.goto("/es/explorar");
  await page.screenshot({ fullPage: true, path: `/tmp/termometro-${project}-explorar.png` });
});
