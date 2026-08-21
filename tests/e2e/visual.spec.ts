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
  await page.screenshot({ caret: "initial", fullPage: true, path: `/tmp/termo-${project}-home.png` });

  await page.goto("/es/reportar");
  await expect(page.getByText("Reportar", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ caret: "initial", fullPage: true, path: `/tmp/termo-${project}-reportar.png` });
  await page.getByTestId("submit-report").click();
  const missingCarDialog = page.getByRole("dialog", { name: "¿Seguro que quieres enviar un reporte sin número de coche?" });
  await expect(missingCarDialog).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ caret: "initial", fullPage: false, path: `/tmp/termo-${project}-missing-car-dialog.png` });
  await missingCarDialog.getByRole("button", { name: "Añadir coche" }).click();

  await page.goto("/es/explorar");
  await expect(page.getByText("Evolución de cada línea")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("car-explorer-chart")).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ caret: "initial", fullPage: true, path: `/tmp/termo-${project}-explorar.png` });

  await page.goto("/es/explorar?tipo=anden");
  await expect(page.getByText("Peores andenes")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Porcentaje de andenes sin AC")).toBeVisible();
  await page.screenshot({ caret: "initial", fullPage: true, path: `/tmp/termo-${project}-explorar-andenes.png` });

  await page.goto("/es/metodologia");
  await expect(page.getByRole("heading", { name: "¿Por qué esta herramienta?" })).toBeVisible({ timeout: 15_000 });
  await openPopover(page, "Secciones", "Ir a sección");
  await page.getByRole("link", { name: "Indicador Termo" }).click();
  await expect(page.getByText("indicador_termo =")).toBeVisible();
  await page.goto("/es/metodologia");
  await expect(page.getByText("Valores actuales usados por línea")).toBeVisible();
  await page.screenshot({ caret: "initial", fullPage: true, path: `/tmp/termo-${project}-metodologia.png` });

  await page.goto("/es/explorar");
  await expect(page.getByText("Evolución de cada línea")).toBeVisible({ timeout: 15_000 });
  await openPopover(page, "Filtros", "Filtrar exploración");
  await page.screenshot({ caret: "initial", fullPage: false, path: `/tmp/termo-${project}-filters.png` });
  await page.getByLabel("Cerrar menú").click();

  await openPopover(page, "Gráficas", "Ir a módulo");
  await page.screenshot({ caret: "initial", fullPage: false, path: `/tmp/termo-${project}-shortcuts.png` });

  expect(consoleErrors).toEqual([]);
});
