type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Tiny pub/sub used by the data layer to notify React components that new live
 * market data has arrived (candles, sparklines, quotes). Keeps the sync
 * provider interface decoupled from React state.
 */
export const marketEvents = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(): void {
    listeners.forEach((l) => l());
  },
};