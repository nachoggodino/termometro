import { expect, test } from "@playwright/test";

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
  await page.getByRole("button", { name: "Secciones" }).click();
  await expect(page.getByText("Ir a sección")).toBeVisible();
  await page.getByRole("link", { name: "Indicador Termo" }).click();
  await expect(page.getByText("indicador_termo =")).toBeVisible();
  await page.goto("/es/metodologia");
  await expect(page.getByText("Valores actuales usados por línea")).toBeVisible();
  await page.screenshot({ fullPage: true, path: `/tmp/termo-${project}-metodologia.png` });

  await page.goto("/es/explorar");
  await expect(page.getByText("Evolución de cada línea")).toBeVisible();
  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByText("Filtrar exploración")).toBeVisible();
  await page.screenshot({ fullPage: false, path: `/tmp/termo-${project}-filters.png` });
  await page.getByLabel("Cerrar menú").click();

  await page.getByRole("button", { name: "Gráficas" }).click();
  await expect(page.getByText("Ir a módulo")).toBeVisible();
  await page.screenshot({ fullPage: false, path: `/tmp/termo-${project}-shortcuts.png` });

  expect(consoleErrors).toEqual([]);
});
