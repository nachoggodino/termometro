import { expect, test } from "@playwright/test";

test("home exposes the two primary actions and switches language", async ({ page }) => {
  await page.goto("/es");

  await expect(page.getByText("Termómetro de Madrid").first()).toBeVisible();
  await expect(page.getByTestId("home-report")).toBeVisible();
  await expect(page.getByTestId("home-explore")).toBeVisible();

  await page.getByRole("button", { name: "Menú" }).click();
  await page.getByTestId("lang-en").click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByTestId("home-report")).toBeVisible();
});

test("report flow submits and lands on filtered dashboard", async ({ page }, testInfo) => {
  await page.goto("/es/reportar");

  await expect(page.getByRole("heading", { name: "Reportar calor" })).toBeVisible();
  await page.getByTestId("heat-infierno").click();
  const carNumber = String(10_000 + ((Date.now() + testInfo.workerIndex) % 90_000));
  await page.getByPlaceholder("Ej. M1234 o R12345").fill(`m${carNumber}`);
  await page.getByTestId("submit-report").click();

  await expect(page).toHaveURL(/\/es\/explorar\?reported=1/);
  await expect(page.getByText("Evolución de cada línea")).toBeVisible();
  await expect(page.getByText("Peores coches")).toBeVisible();

  const undoResponse = page.waitForResponse((response) => response.url().includes("/api/reports/") && response.request().method() === "DELETE");
  await page.getByRole("button", { name: "Deshacer" }).click();
  await undoResponse;
  await page.reload();
  await expect(page.getByText(`M-${carNumber}`)).toHaveCount(0);
});

test("report flow blocks invalid car codes", async ({ page }) => {
  await page.goto("/es/reportar");

  await page.getByPlaceholder("Ej. M1234 o R12345").fill("1234");
  await expect(page.getByText("Usa una letra y 4 o 5 números")).toBeVisible();
  await expect(page.getByTestId("submit-report")).toBeDisabled();
});

test("explore filters and theme control render on mobile", async ({ page }) => {
  await page.goto("/es/explorar");

  await page.getByRole("button", { name: "Filtros" }).click();
  await page.getByRole("button", { name: "L5", exact: true }).click();
  await page.getByRole("button", { name: "L1", exact: true }).click();
  await page.getByRole("button", { name: "7 días" }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/linea=L5%2CL1|linea=L5,L1/);
  await expect(page).not.toHaveURL(/rango=/);

  await page.getByRole("button", { name: "Menú" }).click();
  await expect(page.getByTestId("theme-toggle")).toBeVisible();
  await page.getByTestId("theme-toggle").getByRole("button", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
