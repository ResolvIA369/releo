import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProfile } from "../hooks/useProfile";
import { createPersistenceManager } from "@/features/persistence/services/db";

describe("useProfile", () => {
  beforeEach(async () => {
    const manager = createPersistenceManager();
    await manager.clear();
  });

  it("starts in loading then resolves to missing when no profile", async () => {
    const { result } = renderHook(() => useProfile());

    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("missing");
    });
    expect(result.current.profile).toBeNull();
  });

  it("resolves to ready when profile exists", async () => {
    const manager = createPersistenceManager();
    await manager.saveProfile("Sofía");

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.profile!.childName).toBe("Sofía");
  });

  it("save() creates profile and transitions to ready", async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.status).toBe("missing");
    });

    await act(async () => {
      await result.current.save("Mateo");
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.profile!.childName).toBe("Mateo");
  });

  it("remove() deletes profile and transitions to missing", async () => {
    const manager = createPersistenceManager();
    await manager.saveProfile("Sofía");

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      await result.current.remove();
    });

    expect(result.current.status).toBe("missing");
    expect(result.current.profile).toBeNull();
  });
});
