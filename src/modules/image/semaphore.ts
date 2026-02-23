export default class Semaphore {
  private max: number;
  private current: number;
  private queue: Array<() => void>;

  constructor(max: number) {
    this.max = Math.max(1, Math.floor(max));
    this.current = 0;
    this.queue = [];
  }

  async acquire(): Promise<() => void> {
    if (this.current < this.max) {
      this.current++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        this.current--;
        const next = this.queue.shift();
        if (next) next();
      };
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.current++;
        let released = false;
        resolve(() => {
          if (released) return;
          released = true;
          this.current--;
          const next = this.queue.shift();
          if (next) next();
        });
      });
    });
  }

  // Helper to run a function under the semaphore
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}
