import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages as esMessages } from "@/lib/i18n/messages/es";
import { ReportForm } from "./report-form";

const push = vi.fn();
const toastMock = vi.hoisted(() =>
  Object.assign(vi.fn(), {
    success: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

describe("platform report form", () => {
  beforeEach(() => {
    push.mockReset();
    toastMock.mockReset();
    toastMock.success.mockReset();
  });

  it("submits a canonical line/station platform report and redirects to that line", async () => {
    const user = userEvent.setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ suggestions: ["M2001"] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, report: { id: "platform-1" }, undoToken: "undo-1" }),
      });
    vi.stubGlobal("fetch", fetch);

    render(<ReportForm dictionary={esMessages} locale="es" />);

    await user.click(screen.getByRole("radio", { name: "Andén" }));
    const stationInput = screen.getByRole("combobox");
    await user.type(stationInput, "sol");
    await user.click(screen.getByRole("option", { name: "Sol" }));
    await user.click(screen.getByTestId("submit-report"));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/reports",
      expect.objectContaining({
        body: JSON.stringify({
          line: "L1",
          state: "calor",
          locationKind: "platform",
          stationId: "sol",
        }),
      }),
    );
    expect(push).toHaveBeenCalledWith("/es/explorar?linea=L1");
  });
});
