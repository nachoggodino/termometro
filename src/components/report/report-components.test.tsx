import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages as esMessages } from "../../lib/i18n/messages/es";
import { HeatSelector } from "./heat-selector";
import { LinePicker } from "./line-picker";
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

describe("report controls", () => {
  beforeEach(() => {
    push.mockReset();
    toastMock.mockReset();
    toastMock.success.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ suggestions: ["M1001"] }),
      }),
    );
  });

  it("marks the selected line and changes selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<LinePicker label={esMessages.reportForm.line} onChange={onChange} value="L1" />);

    expect(screen.getByRole("button", { name: "L1" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "L5" }));
    expect(onChange).toHaveBeenCalledWith("L5");
  });

  it("keeps heat states equal until selected and shows selected copy", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<HeatSelector dictionary={esMessages} label={esMessages.reportForm.heatState} onChange={onChange} value="calor" />);

    expect(screen.getByRole("button", { name: "Calor" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(esMessages.states.calor.description)).toBeVisible();
    await user.click(screen.getByTestId("heat-infierno"));
    expect(onChange).toHaveBeenCalledWith("infierno");
  });

  it("disables report submission for invalid car codes", async () => {
    const user = userEvent.setup();

    render(<ReportForm dictionary={esMessages} locale="es" />);

    await user.type(screen.getByPlaceholderText(esMessages.reportForm.carPlaceholder), "1234");

    expect(screen.getByText(/Usa una letra/)).toBeVisible();
    expect(screen.getByTestId("submit-report")).toBeDisabled();
  });

  it("submits normalized car codes", async () => {
    const user = userEvent.setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ suggestions: ["M1001"] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true, report: { id: "report-1" }, undoToken: "undo-1" }),
      });
    vi.stubGlobal("fetch", fetch);

    render(<ReportForm dictionary={esMessages} locale="es" />);

    await user.type(screen.getByPlaceholderText(esMessages.reportForm.carPlaceholder), "m-1234");
    await user.click(screen.getByTestId("submit-report"));

    expect(fetch).toHaveBeenLastCalledWith(
      "/api/reports",
      expect.objectContaining({
        body: JSON.stringify({ line: "L1", state: "calor", car: "M1234" }),
      }),
    );
    expect(toastMock.success).toHaveBeenCalledWith(esMessages.reportForm.success, expect.any(Object));
  });

  it("shows a submit failure instead of the helper subtitle when the API fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ suggestions: ["M1001"] }),
        })
        .mockRejectedValueOnce(new Error("network failed")),
    );

    render(<ReportForm dictionary={esMessages} locale="es" />);

    await user.click(screen.getByTestId("submit-report"));

    expect(toastMock).toHaveBeenCalledWith(esMessages.reportForm.submitFailed);
    expect(toastMock).not.toHaveBeenCalledWith(esMessages.reportForm.subtitle);
  });
});
