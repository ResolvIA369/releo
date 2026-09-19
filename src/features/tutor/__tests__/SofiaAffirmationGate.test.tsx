import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SofiaAffirmationGate as GateType } from "../components/SofiaAffirmationGate";

vi.mock("@/shared/services/sofiaVoice", () => ({
  sofiaPlayAudio: vi.fn().mockResolvedValue(undefined),
  stopVoice: vi.fn(),
}));

// El "no vuelve a aparecer en esa sesión" vive en una variable de módulo
// (a propósito: debe resetear en cada apertura de la app, no persistir para
// siempre). vi.resetModules() + import dinámico por test evita que un test
// contamine el estado del siguiente.
async function freshGate(): Promise<typeof GateType> {
  vi.resetModules();
  const mod = await import("../components/SofiaAffirmationGate");
  return mod.SofiaAffirmationGate;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SofiaAffirmationGate — una vez por sesión, antes del menú de mundos", () => {
  it("bloquea a los hijos y muestra una de las 8 afirmaciones en la primera apertura", async () => {
    const Gate = await freshGate();
    render(
      <Gate>
        <div>Menú de mundos</div>
      </Gate>
    );

    expect(screen.queryByText("Menú de mundos")).toBeNull();
    await waitFor(() => {
      expect(screen.getByText(/¿Listo\? Repetí conmigo:/)).toBeTruthy();
    });
  });

  it("saltar la afirmación revela a los hijos y no vuelve a aparecer en la misma sesión", async () => {
    const Gate = await freshGate();
    const user = userEvent.setup();
    const { unmount } = render(
      <Gate>
        <div>Menú de mundos</div>
      </Gate>
    );

    await waitFor(() => screen.getByRole("button", { name: "Saltar →" }));
    await user.click(screen.getByRole("button", { name: "Saltar →" }));

    expect(await screen.findByText("Menú de mundos")).toBeTruthy();
    expect(screen.queryByText(/¿Listo\? Repetí conmigo:/)).toBeNull();

    // Simula navegar a otra pantalla dentro de la misma sesión (el layout
    // se vuelve a montar, pero el módulo — y su flag en memoria — es el mismo).
    unmount();
    render(
      <Gate>
        <div>Otra pantalla</div>
      </Gate>
    );

    expect(await screen.findByText("Otra pantalla")).toBeTruthy();
    expect(screen.queryByText(/¿Listo\? Repetí conmigo:/)).toBeNull();
  });
});
