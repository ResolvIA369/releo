import { useEffect, useRef } from "react";

/**
 * In demo mode, auto-executes an action after a delay whenever
 * the condition is true. Cleans up on unmount or when condition
 * changes. Used by every game to auto-select the correct answer.
 */
export function useDemoAutoplay(
  isDemo: boolean,
  condition: boolean,
  action: () => void,
  delayMs = 1500,
) {
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!isDemo || !condition) return;
    const t = setTimeout(() => actionRef.current(), delayMs);
    return () => clearTimeout(t);
  }, [isDemo, condition, delayMs]);
}
