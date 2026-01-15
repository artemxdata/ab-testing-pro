import { useEffect, useState } from "react";
import { loadPoliciesFromPublic } from "./policyLoader";

export function usePolicies() {
  const [policyDoc, setPolicyDoc] = useState(null);
  const [policyError, setPolicyError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setPolicyError(null);

    try {
      const doc = await loadPoliciesFromPublic();
      setPolicyDoc(doc);
    } catch (e) {
      setPolicyDoc(null);
      setPolicyError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setPolicyError(null);

      try {
        const doc = await loadPoliciesFromPublic();
        if (!cancelled) setPolicyDoc(doc);
      } catch (e) {
        if (!cancelled) {
          setPolicyDoc(null);
          setPolicyError(e?.message || String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { policyDoc, policyError, loading, reload: load };
}
