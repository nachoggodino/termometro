import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { messages as esMessages } from "@/lib/i18n/messages/es";
import { ChartCard } from "./chart-card";

describe("ChartCard", () => {
  it("falls back to sharing text when image export is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <TooltipProvider>
        <ChartCard dictionary={esMessages} rangeLabel="Hoy" title="Modulo de prueba">
          <p>Contenido</p>
        </ChartCard>
      </TooltipProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: `${esMessages.common.shareCard}: Modulo de prueba` }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Modulo de prueba"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(esMessages.common.disclaimer));
  });

  it("shows loading feedback while share fallback is pending", async () => {
    let resolveWrite: () => void = () => {};
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <TooltipProvider>
        <ChartCard dictionary={esMessages} rangeLabel="Hoy" title="Modulo de prueba">
          <p>Contenido</p>
        </ChartCard>
      </TooltipProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: `${esMessages.common.shareCard}: Modulo de prueba` }));

    const busyButton = screen.getByRole("button", { name: `${esMessages.common.sharePreparing}: Modulo de prueba` });
    expect(busyButton).toBeDisabled();
    expect(busyButton).toHaveAttribute("aria-busy", "true");

    resolveWrite();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: `${esMessages.common.shareCard}: Modulo de prueba` })).toBeEnabled();
    });
  });
});
