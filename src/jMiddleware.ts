type INextCallback<V = any> = (value?: V) => Promise<unknown> | unknown;
type IMiddleware<V = any, C = any> = (value: V, next: INextCallback, context: C) => Promise<unknown> | unknown;

function compose<V, C>(middlewares: IMiddleware[], context: C, isAsync: boolean) {
  return function (value: V) {
    function dispatchAsync(i: number, inputValue = value): Promise<unknown> {
      const fn = middlewares[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(
          fn(inputValue, dispatchAsync.bind(null, i + 1), context)
        );
      } catch (err) {
        return Promise.resolve(err);
      }
    }

    function dispatchSync(i: number, inputValue = value): unknown {
      const fn = middlewares[i];
      if (!fn) return undefined;
      return fn(inputValue, dispatchAsync.bind(null, i + 1), context);
    }

    return isAsync ? dispatchAsync(0) : dispatchSync(0);
  }
}

class Middleware<V, C> {
  #middlewares: IMiddleware[] = [];
  #context?: C;

  constructor(context?: C) {
    this.#context = context;
  }

  use<V>(middleware: IMiddleware<V, C>) {
    this.#middlewares.push(middleware);
    return this;
  }

  start(value?: V, isAsync = true) {
    return compose(this.#middlewares, this.#context, isAsync)(value);
  }
}

export default Middleware;
