import { useCallback, useRef, useState } from 'react';

/**
 * Guarda de envio único: `guard(fn)` ignora chamadas enquanto outra está em
 * andamento (o ref bloqueia no mesmo tick, antes de o estado re-renderizar).
 * `busy` serve para `loading`/`disabled` em botões.
 */
export function useBusy() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);

  const guard = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (running.current) return undefined;
    running.current = true;
    setBusy(true);
    try {
      return await fn();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  return { busy, guard };
}
