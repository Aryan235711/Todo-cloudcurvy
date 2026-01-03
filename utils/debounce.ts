/**
 * Debounce Utility
 * Prevents rapid-fire function calls and race conditions in storage operations
 */

export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

/**
 * Creates a debounced version of a function
 * Delays execution until after wait milliseconds have elapsed since last invocation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, lastArgs!);
      timeoutId = null;
      lastArgs = null;
    }, wait);
  } as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId);
      func.apply(null, lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled version of a function
 * Ensures function is called at most once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastRun = 0;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastRun >= wait) {
      func.apply(this, args);
      lastRun = now;
    } else {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastRun = Date.now();
        timeoutId = null;
      }, wait - (now - lastRun));
    }
  } as DebouncedFunction<T>;

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  throttled.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

/**
 * Async debounce for promise-based functions
 * Returns a promise that resolves with the debounced function result
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingResolve: ((value: any) => void) | null = null;
  let pendingReject: ((error: any) => void) | null = null;

  return function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        // Reject previous pending promise
        if (pendingReject) {
          pendingReject(new Error('Debounced call cancelled'));
        }
      }

      pendingResolve = resolve;
      pendingReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await func.apply(this, args);
          if (pendingResolve) {
            pendingResolve(result);
          }
        } catch (error) {
          if (pendingReject) {
            pendingReject(error);
          }
        } finally {
          timeoutId = null;
          pendingResolve = null;
          pendingReject = null;
        }
      }, wait);
    });
  };
}

/**
 * Batch processor for collecting multiple updates and processing them together
 * Useful for reducing write operations to storage
 */
export class BatchProcessor<T> {
  private items: T[] = [];
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private processor: (items: T[]) => void | Promise<void>;
  private wait: number;

  constructor(processor: (items: T[]) => void | Promise<void>, wait: number = 300) {
    this.processor = processor;
    this.wait = wait;
  }

  add(item: T): void {
    this.items.push(item);

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.wait);
  }

  async flush(): Promise<void> {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.items.length > 0) {
      const itemsToProcess = [...this.items];
      this.items = [];
      await this.processor(itemsToProcess);
    }
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.items = [];
  }

  get pending(): number {
    return this.items.length;
  }
}
