import { useCallback, useEffect, useState } from 'preact/hooks';

// A view-only concern (no HA involvement), so it lives in the product
// package rather than @zupre/core. Returns a ref callback (not useRef) so
// the ResizeObserver can be (re)attached as soon as the node mounts, without
// waiting for a separate effect to read a ref whose value hasn't committed
// yet.
export const useElementWidth = <T extends HTMLElement>(): [(el: T | null) => void, number] => {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  const ref = useCallback((el: T | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return undefined;

    setWidth(node.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [node]);

  return [ref, width];
};
