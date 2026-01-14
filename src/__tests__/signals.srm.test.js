import { computeSrmPValue } from "../core/signals";

describe("computeSrmPValue", () => {
  test("equal split 1000 vs 1000 should be ~1", () => {
    const p = computeSrmPValue(1000, 1000);
    expect(p).toBeGreaterThan(0.99);
    expect(p).toBeLessThanOrEqual(1);
  });

  test("bad split 1000 vs 2000 should be ~0", () => {
    const p = computeSrmPValue(1000, 2000);
    expect(p).toBeLessThan(1e-6);
  });

  test("zero visitors should return 0 (invalid split)", () => {
    const p = computeSrmPValue(0, 1000);
    expect(p).toBe(0);
  });
});
