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
  await expect(page.getByTestId("home-report")).toBeVisible();
});

test("report flow submits and lands on filtered dashboard", async ({ page }, testInfo) => {
  const car = getUniqueTestCar(testInfo.project.name);
  const formattedCar = `${car[0]}-${car.slice(1)}`;

  await page.goto("/es/reportar");

  await expect(page.getByRole("heading", { name: "Reportar calor" })).toBeVisible();
  await page.getByPlaceholder("Ej. M1234 o R-5469").fill(car);
  await page.getByTestId("heat-infierno").click();
  await page.getByTestId("submit-report").click();

  await expect(page).toHaveURL(new RegExp(`/es/explorar\\?reported=1&coche=${car}`));
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
  const projectOffset = projectName === "mobile" ? 10_000 : 20_000;
  const numericCode = 10_000 + ((runId + runAttempt * 997 + projectOffset) % 90_000);
  return `M${numericCode}`;
}

test("report flow blocks invalid car codes", async ({ page }) => {
  await page.goto("/es/reportar");

  await page.getByPlaceholder("Ej. M1234 o R-5469").fill("1234");
  await expect(page.getByText("Usa una letra y 4 o 5 números")).toBeVisible();
  await expect(page.getByTestId("submit-report")).toBeDisabled();
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
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/linea=L5%2CL1|linea=L5,L1/);
  await expect(page).not.toHaveURL(/rango=/);

  await page.getByTestId("worst-car-row").first().click();
  await expect(page.locator("#car-explorer")).toBeInViewport();

  await page.getByRole("button", { name: "Menú" }).click();
  await expect(page.getByTestId("theme-toggle")).toBeVisible();
  await page.getByTestId("theme-toggle").getByRole("button", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
