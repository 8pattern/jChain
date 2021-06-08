import JMiddleware from './jMiddleware';

describe('Async', () => {
  describe('Value', () => {
    test('Value can be Initialized by any types', () => {
      const middleware = new JMiddleware();
      const mGetValue = jest.fn();
      middleware.use(mGetValue)

      middleware.startAsync(1);
      expect(mGetValue.mock.calls[mGetValue.mock.calls.length - 1][0]).toBe(1);

      middleware.startAsync(true);
      expect(mGetValue.mock.calls[mGetValue.mock.calls.length - 1][0]).toBe(true);

      middleware.startAsync(null);
      expect(mGetValue.mock.calls[mGetValue.mock.calls.length - 1][0]).toBe(null);

      middleware.startAsync();
      expect(mGetValue.mock.calls[mGetValue.mock.calls.length - 1][0]).toBe(undefined);

      middleware.startAsync({});
      expect(mGetValue.mock.calls[mGetValue.mock.calls.length - 1][0]).toEqual({});
    });

    test('Value can be from the parameter of last middleware', () => {
      const middleware = new JMiddleware();
      const mGetValue = jest.fn((_, next) => next());
      middleware
        .use(async (_, next) => await next(1))
        .use(mGetValue)
        .use(async (_, next) => await next(true))
        .use(mGetValue)
        .use(async (_, next) => await next({}))
        .use(mGetValue)
        .startAsync()

      expect(mGetValue.mock.calls[0][0]).toBe(1);
      expect(mGetValue.mock.calls[1][0]).toBe(true);
      expect(mGetValue.mock.calls[2][0]).toEqual({});
    });

    test('If last middleware doesn`t assign a value, use initial value by default', () => {
      const middleware = new JMiddleware();
      const mGetValue = jest.fn((_, next) => next());
      const initialValue = {};
      middleware
        .use(async (_, next) => await next(1))
        .use(mGetValue)
        .use(async (_, next) => await next(true))
        .use(mGetValue)
        .use(async (_, next) => await next())
        .use(mGetValue)
        .use(async (_, next) => await next({}))
        .use(mGetValue)
        .use(async (_, next) => await next())
        .use(mGetValue)
        .startAsync(initialValue)

      expect(mGetValue.mock.calls[0][0]).toBe(1);
      expect(mGetValue.mock.calls[1][0]).toBe(true);
      expect(mGetValue.mock.calls[2][0]).toBe(initialValue);
      expect(mGetValue.mock.calls[3][0]).toEqual({});
      expect(mGetValue.mock.calls[4][0]).toBe(initialValue);
    });
  });

  describe('Context', () => {
    test('Lanch with Context, undefined by default', () => {
      const middleware = new JMiddleware();
      const mGetContext = jest.fn();
      middleware.use(mGetContext).startAsync();
      expect(mGetContext.mock.calls[mGetContext.mock.calls.length - 1][2]).toBe(undefined);
    });

    test('Context can be any types', () => {
      const mGetContext = jest.fn();

      const m1 = new JMiddleware(1);
      m1.use(mGetContext).startAsync();
      expect(mGetContext.mock.calls[mGetContext.mock.calls.length - 1][2]).toBe(1);

      const m2 = new JMiddleware(true);
      m2.use(mGetContext).startAsync();
      expect(mGetContext.mock.calls[mGetContext.mock.calls.length - 1][2]).toBe(true);

      const m3 = new JMiddleware({});
      m3.use(mGetContext).startAsync();
      expect(mGetContext.mock.calls[mGetContext.mock.calls.length - 1][2]).toEqual({});

      const m4 = new JMiddleware();
      m4.use(mGetContext).startAsync();
      expect(mGetContext.mock.calls[mGetContext.mock.calls.length - 1][2]).toBe(undefined);
    });

    test('Context is immutable among middlewares', () => {
      const Context: any = {};
      const mGetContext = jest.fn(async (_, next, c) => await next());
      const middleware = new JMiddleware(Context);
      
      middleware
        .use(async (_, next, context) => {
          context.a = 1;
          await next();
          context.a = 2;
        })
        .use(mGetContext)
        .use(async (_, next, context) => {
          context.b = true;
          await next();
          context.b = false;
        })
        .use(mGetContext)
        .use(async (_, next, context) => {
          context.c = {};
          await next();
        })
        .use(mGetContext)
        .startAsync()

      expect(mGetContext.mock.calls[0][2]).toBe(Context);
      expect(mGetContext.mock.calls[0][2]).toMatchObject({ a: 1 });

      expect(mGetContext.mock.calls[1][2]).toBe(Context);
      expect(mGetContext.mock.calls[1][2]).toMatchObject({ a: 1, b: true });
      
      expect(mGetContext.mock.calls[2][2]).toBe(Context);
      expect(mGetContext.mock.calls[2][2]).toMatchObject({ a: 1, b: true, c: {} });
    });
  });

  describe('Middleware', () => {
    test('Middleware receives: value, next callback & context', () => {
      const context = {};
      const middleware = new JMiddleware(context);
      const m = jest.fn();
      middleware.use(m).startAsync();

      expect(m).toHaveBeenCalledWith(undefined, expect.any(Function), context);
    });
  });

  describe('Return', () => {
    test('By default, return a promise', () => {
      const middleware = new JMiddleware();
      expect(middleware.startAsync()).toEqual(expect.any(Promise));
      expect(middleware.use(jest.fn()).startAsync()).toEqual(expect.any(Promise));
    });

    test('The middleware`s return will be received by the last middleware, and the first middleware will return the final result', async () => {
      const middleware = new JMiddleware();
      const res = await middleware
        .use(async (v, next) => {
          const r = await next();
          expect(r).toBe(true);
          return 1;
        })
        .use(async (v, next) => {
          await next();
          return true;
        })
        .startAsync();

      expect(res).toBe(1);
    });

    test('Without middlewares, return initial Value', async () => {
      const middleware = new JMiddleware();
      expect(await middleware.startAsync(1)).toBe(1);
      expect(await middleware.startAsync(true)).toBe(true);
      expect(await middleware.startAsync({})).toEqual({});
    });

    test('reject when any error raises', async () => {
      const middleware = new JMiddleware();
      const error = new Error('test');
      const mError = () => {
        throw error;
      };
      const mNormal = async (_: any, next: any) => {
        await next();
      };

      await expect(middleware.use(mError).startAsync()).rejects.toBe(error);
      await expect(middleware.use(mNormal).use(mError).startAsync()).rejects.toBe(error);
      await expect(middleware.use(mNormal).use(mError).use(mNormal).startAsync()).rejects.toBe(error);
    });
  });
});

describe('Sync', () => {
  describe('Value', () => {
    test('If last middleware doesn`t assign a value, use initial value by default', () => {
      const middleware = new JMiddleware();
      const mGetValue = jest.fn((_, next) => next());
      const initialValue = {};
      middleware
        .use((_, next) => next(1))
        .use(mGetValue)
        .use((_, next) => next(true))
        .use(mGetValue)
        .use((_, next) => next())
        .use(mGetValue)
        .use((_, next) => next({}))
        .use(mGetValue)
        .use((_, next) => next())
        .use(mGetValue)
        .startSync(initialValue)

      expect(mGetValue.mock.calls[0][0]).toBe(1);
      expect(mGetValue.mock.calls[1][0]).toBe(true);
      expect(mGetValue.mock.calls[2][0]).toBe(initialValue);
      expect(mGetValue.mock.calls[3][0]).toEqual({});
      expect(mGetValue.mock.calls[4][0]).toBe(initialValue);
    });
  });

  describe('Return', () => {
    test('Error raises', async () => {
      const middleware = new JMiddleware();
      const error = new Error('test');
      const mError = () => {
        throw error;
      };
      const mNormal = (_: any, next: any) => {
        next();
      };
      const mCheckFn = jest.fn();

      try {
        middleware.use(mError).startSync()
      } catch (err) {
        mCheckFn();
        expect(err).toBe(error);
      }

      try {
        middleware.use(mNormal).use(mError).startSync()
      } catch (err) {
        mCheckFn();
        expect(err).toBe(error);
      }

      try {
        middleware.use(mNormal).use(mError).use(mNormal).startSync()
      } catch (err) {
        mCheckFn();
        expect(err).toBe(error);
      }
    });
  });
});