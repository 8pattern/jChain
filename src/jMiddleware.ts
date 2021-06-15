type INextCallback<V = any, R = Promise<unknown> | unknown> = (value?: V) => R;
type IMiddleware<V = any, C = any, R = Promise<unknown> | unknown> = (value: V, next: INextCallback, context: C) => R;

function compose<V, C>(middlewares: IMiddleware[], context: C, isAsync: boolean) {
  return (value: V) => {
    function dispatchAsync(i: number, inputValue = value): Promise<unknown> {
      const fn = middlewares[i];
      if (!fn) return Promise.resolve(inputValue);
      try {
        const res = fn(inputValue, dispatchAsync.bind(null, i + 1), context);
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    function dispatchSync(i: number, inputValue = value): unknown {
      const fn = middlewares[i];
      if (!fn) return inputValue;
      return fn(inputValue, dispatchSync.bind(null, i + 1), context);
    }

    return isAsync ? dispatchAsync(0) : dispatchSync(0);
  }
}

class JMiddleware<V, C> {
  private middlewares: IMiddleware[] = [];
  private context?: C;

  constructor(context?: C) {
    this.context = context;
  }

  use<P>(middleware: IMiddleware<P, C>) {
    this.middlewares.push(middleware);
    return this;
  }

  private start(value?: V, isAsync = true) {
    return compose(this.middlewares, this.context, isAsync)(value);
  }

  startSync(value?: V) {
    return this.start(value, false) as unknown;
  }

  startAsync(value?: V) {
    return this.start(value, true) as Promise<unknown>;
  }
}

export default JMiddleware;
