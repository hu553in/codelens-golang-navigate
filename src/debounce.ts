export function debounce<T extends (...args: unknown[]) => void>(fn: T, waitMs: number): T {
  let timer: NodeJS.Timeout | undefined;

  const wrapped = ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  }) as T;

  return wrapped;
}
