import { useEffect, useState } from "react";

export function useAirdrop(address) {
  const [airdrop, setAirdrop] = useState(null);
  const [airdropLoading, setAirdropLoading] = useState(false);
  const [airdropError, setAirdropError] = useState(null);

  useEffect(() => {
    if (!address) {
      setAirdrop(null);
      setAirdropLoading(false);
      setAirdropError(null);
      return;
    }

    const fetchAirdrop = async () => {
      try {
        setAirdropLoading(true);
        setAirdropError(null);

        const res = await fetch(
          `https://heatrush-api.husam-aljabre33.workers.dev/airdrop/${address}`
        );

        if (!res.ok) {
          throw new Error("Failed to load airdrop data");
        }

        const json = await res.json();
        setAirdrop(json);
      } catch (err) {
        console.error(err);
        setAirdropError(err.message || "Error loading airdrop data");
      } finally {
        setAirdropLoading(false);
      }
    };

    fetchAirdrop();
  }, [address]);

  return { airdrop, airdropLoading, airdropError };
}
