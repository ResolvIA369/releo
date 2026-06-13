import { describe, it, expect } from "vitest";
import { createWordBag } from "../config/arcade-tuning";
import type { DomanWord } from "@/shared/types/doman";

const mk = (id: string): DomanWord => ({ id, text: id } as DomanWord);
const pool = ["a", "b", "c", "d"].map(mk);

describe("createWordBag — distribución pareja", () => {
  it("recorre todas las palabras una vez antes de repetir ninguna", () => {
    const bag = createWordBag(pool);
    const first = pool.map(() => bag.next().id);
    expect(new Set(first).size).toBe(pool.length); // las 4, sin repetir
    const second = pool.map(() => bag.next().id);
    expect(new Set(second).size).toBe(pool.length); // otra vuelta completa
  });

  it("no repite la última palabra al cruzar de una barajada a la siguiente", () => {
    // rng que produce barajadas degeneradas para forzar el borde
    const bag = createWordBag(pool, () => 0);
    let last: string | null = null;
    for (let i = 0; i < 40; i++) {
      const id = bag.next().id;
      expect(id).not.toBe(last);
      last = id;
    }
  });

  it("con una sola palabra la devuelve siempre", () => {
    const bag = createWordBag([mk("solo")]);
    expect(bag.next().id).toBe("solo");
    expect(bag.next().id).toBe("solo");
  });
});
