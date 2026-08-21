import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StationCombobox } from "./station-combobox";

describe("StationCombobox", () => {
  it("offers only stations on the selected line and resolves accent-insensitive input", async () => {
    const user = userEvent.setup();
    const onStationChange = vi.fn();

    function Harness() {
      const [query, setQuery] = useState("");
      const [stationId, setStationId] = useState<string | null>(null);
      return (
        <StationCombobox
          help="help"
          label="Estación"
          line="L5"
          onQueryChange={setQuery}
          onStationChange={(nextStationId, stationName) => {
            setStationId(nextStationId);
            onStationChange(nextStationId, stationName);
          }}
          placeholder="Escribe una estación…"
          query={query}
          stationId={stationId}
        />
      );
    }

    render(<Harness />);

    const input = screen.getByRole("combobox");
    await user.type(input, "nunez");

    const option = screen.getByRole("option", { name: "Núñez de Balboa" });
    expect(option).toBeVisible();
    expect(screen.queryByRole("option", { name: "Valdecarros" })).not.toBeInTheDocument();
    await user.click(option);
    expect(onStationChange).toHaveBeenCalledWith("nunez-de-balboa", "Núñez de Balboa");
    expect(input).toHaveValue("Núñez de Balboa");
  });
});
