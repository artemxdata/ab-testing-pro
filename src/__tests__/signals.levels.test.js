import { buildSignals } from "../core/signals";

describe("buildSignals levels", () => {
  test("p_value_level GREEN when p_value <= 0.05", () => {
    const s = buildSignals({ p_value: 0.01, uplift_pct: 5, n_control: 1000, n_treatment: 1000 });
    expect(s.p_value_level).toBe("GREEN");
  });

  test("p_value_level RED when p_value > 0.1", () => {
    const s = buildSignals({ p_value: 0.5, uplift_pct: 5, n_control: 1000, n_treatment: 1000 });
    expect(s.p_value_level).toBe("RED");
  });

  test("srm_level GREEN on equal split", () => {
    const s = buildSignals({ p_value: 0.5, uplift_pct: 1, n_control: 1000, n_treatment: 1000 });
    expect(s.srm_level).toBe("GREEN");
    expect(s.srm_p_value).toBeGreaterThan(0.99);
  });

  test("srm_level RED on 1:2 split", () => {
    const s = buildSignals({ p_value: 0.5, uplift_pct: 1, n_control: 1000, n_treatment: 2000 });
    expect(s.srm_level).toBe("RED");
    expect(s.srm_p_value).toBeLessThan(1e-6);
  });
});
