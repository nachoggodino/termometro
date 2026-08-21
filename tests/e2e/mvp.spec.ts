import { expect, test } from "@playwright/test";

test("home exposes the two primary actions and switches language", async ({ page }) => {
  await page.goto("/es");

  await expect(page.getByText("Termo de Madrid").first()).toBeVisible();
  await expect(page.getByTestId("home-report")).toBeVisible();
  await expect(page.getByTestId("home-explore")).toBeVisible();

  await page.getByRole("button", { name: "Menú" }).click();
  await page.getByTestId("lang-en").click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "Report Tell us how the AC is now" })).toBeVisible();
});

test("report flow submits and lands on filtered dashboard", async ({ page }, testInfo) => {
  const car = getUniqueTestCar(testInfo.project.name);
  const formattedCar = `${car[0]}-${car.slice(1)}`;

  await page.goto("/es/reportar");
  await expectReportPage(page);

  await page.getByPlaceholder("Ej. M2434, R-5469 o S3124").fill(car);
  await page.getByTestId("heat-infierno").click();
  await page.getByTestId("submit-report").click();

  await expect(page).toHaveURL(new RegExp(`/es/explorar\\?coche=${car}`));
  await expect(page.getByText("Evolución de cada línea")).toBeVisible();
  await expect(page.getByText("Peores coches")).toBeVisible();
  await expect(page.getByText("Explorar coche")).toBeVisible();
  await expect(page.locator("#car-explorer-input")).toHaveValue(formattedCar);

  const undoResponse = page.waitForResponse((response) => response.url().includes("/api/reports/") && response.request().method() === "DELETE");
  await page.getByRole("button", { name: "Deshacer" }).click();
  expect((await undoResponse).ok()).toBe(true);
});

function getUniqueTestCar(projectName: string) {
  const runId = Number(process.env.GITHUB_RUN_ID ?? Date.now());
  const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT ?? 0);
  const projectOffset = projectName === "mobile" ? 0 : 500;
  const numericCode = 2_000 + ((runId + runAttempt * 997 + projectOffset) % 1_000);
  return `M${numericCode}`;
}

test("report flow submits a canonical platform and lands on platform explore", async ({ page }) => {
  await page.route("**/api/reports", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        report: { id: "platform-report" },
        undoToken: "platform-undo",
      }),
    });
  });
  await page.goto("/es/reportar");
  await expectReportPage(page);

  await page.getByText("Andén", { exact: true }).click();
  const stationInput = page.getByPlaceholder("Escribe una estación…");
  await stationInput.fill("Atocha");
  await page.getByRole("option", { name: "Atocha", exact: true }).click();

  const reportRequest = page.waitForRequest(
    (request) => request.url().endsWith("/api/reports") && request.method() === "POST",
  );
  await page.getByTestId("submit-report").click();

  expect((await reportRequest).postDataJSON()).toEqual({
    line: "L1",
    state: "calor",
    locationKind: "platform",
    stationId: "atocha",
  });
  await expect(page).toHaveURL(/\/es\/explorar\?/, { timeout: 15_000 });
  await expect(page).toHaveURL(/linea=L1/, { timeout: 15_000 });
  await expect(page).toHaveURL(/tipo=anden/, { timeout: 15_000 });
  await expect(page).toHaveURL(/anden=atocha/, { timeout: 15_000 });
});

test("report flow blocks invalid car codes", async ({ page }) => {
  await page.goto("/es/reportar");

  await page.getByPlaceholder("Ej. M2434, R-5469 o S3124").fill("Z1234");
  await expect(page.getByText("Usa M, R o S y 4 o 5 números")).toBeVisible();
  await expect(page.getByTestId("submit-report")).toBeDisabled();
});

test("report flow blocks cars that do not exist on the selected line", async ({ page }, testInfo) => {
  await page.goto("/es/reportar");

  const carInput = page.getByPlaceholder("Ej. M2434, R-5469 o S3124");
  await carInput.fill("M3000");
  await expect(page.getByText("Este coche no existe en esa línea")).toBeVisible();
  await expect(page.getByTestId("submit-report")).toBeDisabled();

  await page.getByRole("button", { name: "L2", exact: true }).click();
  await expect(page.getByText("Este coche no existe en esa línea")).not.toBeVisible();
  await expect(page.getByTestId("submit-report")).toBeEnabled();

  await carInput.fill("M12000");
  await expect(page.getByText("Este coche no existe en esa línea")).toBeVisible();
  await expect(page.getByTestId("submit-report")).toBeDisabled();
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: `/tmp/termo-${testInfo.project.name}-non-existing-car.png`,
  });
});

test("report flow confirms a missing car and can return focus to the car field", async ({ page }) => {
  await page.route("**/api/reports", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ok: true, report: { id: "missing-car-report" }, undoToken: "missing-car-undo" }),
    });
  });
  await page.goto("/es/reportar");
  await expectReportPage(page);

  const submit = page.getByTestId("submit-report");
  await expect(submit).toBeEnabled();
  await submit.click();
  const dialog = page.getByRole("dialog", { name: "¿Seguro que quieres enviar un reporte sin número de coche?" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole("button", { name: "Añadir coche" }).click();
  await expect(page.getByPlaceholder("Ej. M2434, R-5469 o S3124")).toBeFocused();

  await submit.click();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  const reportRequest = page.waitForRequest((request) => request.url().endsWith("/api/reports") && request.method() === "POST");
  await dialog.getByRole("button", { name: "Confirmar" }).click();

  expect((await reportRequest).postDataJSON()).toEqual({ line: "L1", state: "calor", car: null });
});

test("home report counter keeps four digits clear of its icon on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/es");
  await page.waitForLoadState("networkidle");

  const count = page.getByTestId("home-report-count").filter({ visible: true });
  const icon = page.getByTestId("home-report-count-icon").filter({ visible: true });
  await expect(count).toBeVisible();
  await expect(icon).toBeVisible();
  await count.evaluate((element) => { element.textContent = "9999"; });
  await expect(count).toHaveText("9999");
  const countBox = await count.boundingBox();
  const iconBox = await icon.boundingBox();

  expect(countBox).not.toBeNull();
  expect(iconBox).not.toBeNull();
  expect(countBox!.x + countBox!.width).toBeLessThan(iconBox!.x);
});

test("explore filters and theme control render on mobile", async ({ page }) => {
  await page.goto("/es/explorar");

  const filtersButton = page.getByRole("button", { name: "Filtros" });
  const filtersButtonBox = await filtersButton.boundingBox();
  await filtersButton.click();
  const filterDialog = page.locator(".centered-popover", { hasText: "Filtrar exploración" });
  await expect(filterDialog).toBeVisible();
  const box = await filterDialog.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(filtersButtonBox).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - viewport!.width / 2)).toBeLessThanOrEqual(8);
  expect(box!.y - (filtersButtonBox!.y + filtersButtonBox!.height)).toBeLessThanOrEqual(80);
  await page.getByRole("button", { name: "L5", exact: true }).click();
  await page.getByRole("button", { name: "L1", exact: true }).click();
  await page.getByRole("button", { name: "2000", exact: true }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/linea=L5%2CL1|linea=L5,L1/);
  await expect(page).toHaveURL(/serie=2000/);
  await expect(page).not.toHaveURL(/rango=/);

  await page.getByTestId("worst-car-row").first().click();
  await expect(page.locator("#car-explorer")).toBeInViewport();

  await page.getByRole("button", { name: "Menú" }).click();
  await expect(page.getByTestId("theme-toggle")).toBeVisible();
  await page.getByTestId("theme-toggle").getByRole("button", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("explore switches cleanly between car and platform modes", async ({ page }) => {
  await page.goto("/es/explorar");

  const platformMode = page.getByRole("button", { name: "Andén", exact: true });
  await platformMode.click();
  await expect(platformMode).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/tipo=anden/, { timeout: 15_000 });
  await expect(page.getByText("Peores andenes")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Porcentaje de andenes sin AC")).toBeVisible();

  const carMode = page.getByRole("button", { name: "Coche", exact: true });
  await carMode.click();
  await expect(carMode).toHaveAttribute("aria-pressed", "true");
  await expect(page).not.toHaveURL(/tipo=anden/, { timeout: 15_000 });
  await expect(page.getByText("Peores coches")).toBeVisible({ timeout: 15_000 });
});

test("explore lazily loads one car history and one line detail", async ({ page }) => {
  await page.goto("/es/explorar");

  await expect(page.getByTestId("car-explorer-chart")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByTestId("line-detail-card").first().click();
  const dialog = page.getByRole("dialog", { name: "Coches reportados" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("line-detail-car").first()).toBeVisible();
});

async function expectReportPage(page: import("@playwright/test").Page) {
  await expect(page.getByText("Reportar", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("submit-report")).toBeVisible({ timeout: 15_000 });
}
