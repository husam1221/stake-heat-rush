import { useEffect, useState } from "react";

export function useCountdown(targetTimestamp) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        setCountdown("TGE is Live!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setCountdown(`${days}d ${hours}h ${minutes}m`);
    };

    update();
    const timer = setInterval(update, 60 * 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp]);

  return countdown;
}
