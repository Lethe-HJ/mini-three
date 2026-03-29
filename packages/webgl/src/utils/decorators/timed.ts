function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

export type TimedOutcome = "sync" | "resolve" | "reject";

export type TimedLogFn = (info: {
  /** 类名或构造名，方法装饰器在部分环境下可能为 `undefined` */
  className: string | undefined;
  methodName: string;
  /** 从进入方法到本次计时的终点（同步返回或 Promise settled） */
  durationMs: number;
  outcome: TimedOutcome;
}) => void;

const defaultLog: TimedLogFn = ({
  className,
  methodName,
  durationMs,
  outcome,
}) => {
  const scope = className ? `${className}.${methodName}` : methodName;
  console.debug(`[timed] ${scope} ${durationMs.toFixed(3)}ms (${outcome})`);
};

export interface TimedOptions {
  /** 自定义输出；默认 `console.debug` */
  log?: TimedLogFn;
}

/**
 * 记录方法耗时：同步方法在 `return` 时结束计时；若返回 thenable，则在 `resolve` 或 `reject` 时结束计时。
 */
export function timed(options?: TimedOptions): MethodDecorator {
  const log = options?.log ?? defaultLog;

  return <T>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): void => {
    const original = descriptor.value;
    if (typeof original !== "function") {
      return;
    }

    const methodName = String(propertyKey);
    const className =
      "name" in target &&
      typeof (target as { name?: unknown }).name === "string"
        ? (target as { name: string }).name
        : undefined;

    const wrapped = function (this: unknown, ...args: unknown[]) {
      const start = performance.now();

      const done = (outcome: TimedOutcome) => {
        log({
          className,
          methodName,
          durationMs: performance.now() - start,
          outcome,
        });
      };

      try {
        const result = (original as (...args: unknown[]) => unknown).apply(
          this,
          args,
        );
        if (isPromiseLike(result)) {
          return Promise.resolve(result).then(
            (value) => {
              done("resolve");
              return value;
            },
            (reason) => {
              done("reject");
              throw reason;
            },
          );
        }
        done("sync");
        return result;
      } catch (error) {
        done("sync");
        throw error;
      }
    };

    descriptor.value = wrapped as T;
  };
}
