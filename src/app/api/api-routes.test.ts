import { afterEach, describe, expect, it, vi } from "vitest";

const repositoryMock = vi.hoisted(() => ({
  createReportForRequest: vi.fn(),
  getCarSuggestions: vi.fn(),
  undoReport: vi.fn(),
}));
const dashboardMock = vi.hoisted(() => ({
  getCachedCarDetail: vi.fn(),
  getCachedLineDetail: vi.fn(),
  normalizeDashboardCacheKey: vi.fn((search) => ({
    rangeKey: search.range,
    linesKey: search.lines.join(","),
    carSeriesKey: search.carSeries.join(","),
  })),
}));

vi.mock("@/lib/server/reports-repository", () => repositoryMock);
vi.mock("@/lib/server/dashboard-cache", () => dashboardMock);

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

  it("caches successful car suggestions briefly", async () => {
    repositoryMock.getCarSuggestions.mockResolvedValue(["M1234"]);
    const { GET } = await import("./cars/route");

    const response = await GET(new Request("https://termo.test/api/cars?line=L5"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=300, stale-while-revalidate=600");
    expect(payload).toEqual({ suggestions: ["M1234"] });
  });

  it("returns controlled errors when undo fails server-side", async () => {
    repositoryMock.undoReport.mockRejectedValue(new Error("database unavailable"));
    const { DELETE } = await import("./reports/[id]/route");

    const response = await DELETE(
      new Request("https://termo.test/api/reports/report-1", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line: "L1", state: "calor", car: null }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ ok: false, reason: "server_error" });
  });

  it("rejects car identifiers whose prefix is not M, R, or S", async () => {
    const { POST } = await import("./reports/route");

    const response = await POST(
      new Request("https://termo.test/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line: "L1", state: "calor", car: "Z1234" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ ok: false, reason: "invalid" });
    expect(repositoryMock.createReportForRequest).not.toHaveBeenCalled();
  });

  it("rejects retired series 1000 before reaching the repository", async () => {
    const { POST } = await import("./reports/route");

    const response = await POST(
      new Request("https://termo.test/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line: "L1", state: "calor", car: "M1234" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ ok: false, reason: "retired_series" });
    expect(repositoryMock.createReportForRequest).not.toHaveBeenCalled();
  });

  it("loads one bounded car detail with normalized filters", async () => {
    dashboardMock.getCachedCarDetail.mockResolvedValue({ car: "M1234", history: [] });
    const { GET } = await import("./dashboard/car/route");

    const response = await GET(new Request("https://termo.test/api/dashboard/car?coche=M-1234&rango=month&linea=L5,L5&serie=2000"));

    expect(response.status).toBe(200);
    expect(dashboardMock.getCachedCarDetail).toHaveBeenCalledWith("month", "L5", "2000", "M1234");
  });

  it("rejects invalid line detail requests before querying", async () => {
    const { GET } = await import("./dashboard/line/route");

    const response = await GET(new Request("https://termo.test/api/dashboard/line?linea=L99"));

    expect(response.status).toBe(400);
    expect(dashboardMock.getCachedLineDetail).not.toHaveBeenCalled();
  });
});
