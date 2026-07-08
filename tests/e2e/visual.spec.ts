import { expect, test, type Page } from "@playwright/test";

async function openPopover(page: Page, buttonName: string, title: string) {
  const dialog = page.locator(".centered-popover", { hasText: title });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole("button", { name: buttonName }).click();
    if (await dialog.isVisible().catch(() => false)) return dialog;
    await page.waitForTimeout(250);
  }

  await expect(dialog).toBeVisible();
  return dialog;
}

test("captures primary surfaces", async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleErrors.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

  await page.goto("/es");
  await expect(page.getByText("Termo de Madrid").first()).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-home.png` });

  await page.goto("/es/reportar");
  await expect(page.getByRole("heading", { name: "Reportar calor" })).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-reportar.png` });

  await page.goto("/es/explorar");
  await expect(page.getByText("Evolución de cada línea")).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-explorar.png` });

  await page.goto("/es/metodologia");
  await expect(page.getByRole("heading", { name: "Misión y Metodología" })).toBeVisible();
  await openPopover(page, "Secciones", "Ir a sección");
  await page.getByRole("link", { name: "Indicador Termo" }).click();
  await expect(page.getByText("indicador_termo =")).toBeVisible();
  await page.goto("/es/metodologia");
  await expect(page.getByText("Valores actuales usados por línea")).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-metodologia.png` });

  await page.goto("/es/explorar");
  await expect(page.getByText("Evolución de cada línea")).toBeVisible();
  await openPopover(page, "Filtros", "Filtrar exploración");
  await page.screenshot({ fullPage: false, path: `/tmp/termo-${project}-filters.png` });
  await page.getByLabel("Cerrar menú").click();

  await openPopover(page, "Gráficas", "Ir a módulo");
  await page.screenshot({ fullPage: false, path: `/tmp/termo-${project}-shortcuts.png` });

  expect(consoleErrors).toEqual([]);
});
