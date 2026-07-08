import { afterEach, describe, expect, it, vi } from "vitest";

const repositoryMock = vi.hoisted(() => ({
  createReportForRequest: vi.fn(),
  getCarSuggestions: vi.fn(),
  undoReport: vi.fn(),
}));

vi.mock("@/lib/server/reports-repository", () => repositoryMock);

describe("API routes", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns controlled errors when car suggestions fail", async () => {
    repositoryMock.getCarSuggestions.mockRejectedValue(new Error("database unavailable"));
    const { GET } = await import("./cars/route");

    const response = await GET(new Request("https://termo.test/api/cars?line=L5"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ suggestions: [], error: "server_error" });
  });

  it("returns controlled errors when undo fails server-side", async () => {
    repositoryMock.undoReport.mockRejectedValue(new Error("database unavailable"));
    const { DELETE } = await import("./reports/[id]/route");

    const response = await DELETE(
      new Request("https://termo.test/api/reports/report-1", {
        method: "DELETE",
        body: JSON.stringify({ undoToken: "token" }),
      }),
      { params: Promise.resolve({ id: "report-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ ok: false, reason: "server_error" });
  });

  it("keeps report creation errors behind the public server_error reason", async () => {
    repositoryMock.createReportForRequest.mockRejectedValue(new Error("database unavailable"));
    const { POST } = await import("./reports/route");

    const response = await POST(
      new Request("https://termo.test/api/reports", {
        method: "POST",
        body: JSON.stringify({ line: "L1", state: "calor", car: null }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ ok: false, reason: "server_error" });
  });
});
