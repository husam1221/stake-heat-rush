import { useEffect, useState } from "react";

export function useMerkleAirdrop(address) {
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!address) {
      setEntry(null);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/airdrop-merkle.json");
        const json = await res.json();

        const user = json.find(
          (x) => x.address.toLowerCase() === address.toLowerCase()
        );

        setEntry(user || null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [address]);

  return { entry, loading, error };
}
