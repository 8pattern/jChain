# jMiddleware
![Platform: Node/Web](https://img.shields.io/static/v1?label=Platform&message=Node/Web&color=47b8e0)
![](https://github.com/8pattern/jMiddleware/actions/workflows/Check.yml/badge.svg)
![](https://github.com/8pattern/jMiddleware/actions/workflows/Publish.yml/badge.svg)

Organize your functions just like Koa or Express

> If you are familar with the middleware framework of Koa or Express, [**Differences From Koa**](differences-from-koa) may be more suitable to acquaint the package.

## Hello, jMiddleware
```typescript
  import JMiddleware from '@8pattern/jmiddleware'
  const jMiddleware = new JMiddleware();
  jMiddleware.use(async (_, next) => {
    const start = Date.now();
    await next();
    console.log(Date.now() - start);
  });
  jMiddleware.startAsync();
```

## Usage
+ Install
```
  npm i @8pattern/jmiddleware
```
+ Import
```javascript
  import JMiddleware from '@8pattern/jmiddleware'
```
+ Instantiate
```javascript
  const jMiddleware = new JMiddleware();
```
+ Register middlewares
```javascript
  jMiddleware.use((_, next) => {
    const start = Date.now();
    next();
    console.log(Date.now() - start);
  });
```
+ Start
```javascript
  jMiddleware.startSync();
```

## APIs
### Constructor
#### Context
> Type: **any**

> Default: **undefined**

A variable with any types can be defined when getting the instance, which can't be re-asigned in middlewares.
```javascript
  const Context = {};
  const jMiddleware = new JMiddleware(Context);
  jMiddleware.use((_, next, ctx) => {
    console.assert(ctx === Context);
    next();
  });
  jMiddleware.startSync();
```

It is not necessary.
```javascript
  const jMiddleware = new JMiddleware();
  jMiddleware.use((_, next, ctx) => {
    console.assert(ctx === undefined);
    next();
  });
  jMiddleware.startSync();
```

### Middleware
Middlewares will receive three parameters and also can return a value.
#### Parameter: value
> Type: **unknown**

> Default: **last asigned value**

If a middleware want to change the value of the next one, it can tranfer a value to the callback function.
```typescript
  jMiddleware.use((_, next) => {
    next(1);
  });
  jMiddleware.use<number>(v => {
    console.assert(v === 1);
  });
  jMiddleware.startSync();
```
If not receiving a value from the previous middleware, the last one will make effect.
```typescript
  jMiddleware.use((_, next) => {
    next(1);
  });
  jMiddleware.use((v, next) => {
    console.assert(v === 1);
    next(); // not tranfer a value
  });
  jMiddleware.use<number>(v => {
    console.assert(v === 1);
  });
  jMiddleware.startSync();
```

#### Parameter: callback function
> Type: (val?: any) => unknown

> Default: -

It will transfer control to the next middleware. It can change the value of the next middleware by the argument and receiving the return from the next middleware.

```typescript
  jMiddleware.use((_, next) => {
    const res = next(1);
    console.assert(res === 2)
  });
  jMiddleware.use<number>(v => {
    console.assert(v === 1);
    return 2;
  });
  jMiddleware.startSync();
```

#### Parameter: context
> Type: **any**

> Default: **undefined**

It is defined when instantiation.
```javascript
  const Context = {};
  const jMiddleware = new JMiddleware(Context);
  jMiddleware.use((_, next, ctx) => {
    console.assert(ctx === context);
    next();
  });
  jMiddleware.startSync();
```

#### Return
> Type: **any**

> Default: **undefined**

Any middlewares are able to return a value to the previous one (for the first middleware, its return value will be regarded as the final result).

```javascript
  jMiddleware.use((v, next) => {
    const val = `1-before ${v}`;
    const res = next(val);
    return `${res} 1-after`;
  });
  jMiddleware.use((v, next) => {
    const val = `2-before ${v}`;
    const res = next(val);
    return `${res} 2-after`;
  });
  const res = jMiddleware.startSync('0');
  console.log(res); // 2-before 1-before 0 2-after 1-after
```

### Entry
When defining the middlewares, the package provides two methods to start the process: `startSync` and `startAsync`. The only difference is the `startAsync` regards all middlewares as asynchronous methods but `startSync` regards middlewares as synchronous methods.
```javascript
  jMiddleware.use((_, next) => next());
  console.assert(jMiddleware.startSync() === undefined);
  console.assert(jMiddleware.startAsync() instanceof Promise);
```

## Differences From Koa
The package is inspired by [Koa](https://koajs.com/), but it isn't designed for web applications, which accounts for some diferences.

### Parameters
In Koa, middlewares receive two parameters: a context and a callback function. And the context parameter is a complex object to fit web applications. But in this package, middlewares have three parameters.

The first parameter is a variable can be asigned with any types.
```javascript
  // Koa
  app.use(ctx => {
    ctx.body = 'Hello Koa';
  });

  // jMiddleware
  jMiddleware.use(val => {
    console.log(val); // 'any value'
  });
  jMiddleware.startAsync('any value');
```

The second parameter is a callback function which can transfer the value to the next middleware.
```javascript
  // Koa
  app.use(async (ctx, next) => {
    await next();
  });

  // jMiddleware
  jMiddleware.use(async (val, next) => {
    await next('any value from prev middleware')
  });
  jMiddleware.use(val => {
    console.log(val); // 'any value from prev middleware'
  });
  jMiddleware.startAsync();
```
Since the package aims to organize functions in a way of middlewares, we make its parameters more flexiable. If you are familar with the way of Koa, you can asign a object as the initial value.
```javascript
  // jMiddleware
  jMiddleware.use(val => {
    val.body = 'Hello';
  });
  jMiddleware.startAsync({});
```

The third parameter is a varaible which only can be assigned when instantiation.
```javascript
  // jMiddleware
  const jMiddleware = new JMiddleware('any value');
  jMiddleware.use((_, next, ctx) => {
    console.log(ctx); // any value;
  });
  jMiddleware.startAsync();
```

### Async or Sync
In Koa，middlewares are designed as asynchronous methods. But in the package, asynchronous and synchronous methods are both allowed. Besides some scenarios where synchronous methods are more suitable, `async / await` keywords can be avoided when using synchronous methods. The switch are how you start the middlewares.
```javascript
  // Async
  jMiddleware.use(async (_, next) => {
    await next();
  }); 
  jMiddleware.startAsync();

  // Sync
  jMiddleware.use((_, next) => {
    next();
  }); 
  jMiddleware.startSync();
```

### Return
Koa doesn't need return values, which are allowed in this package. The rule is any middleware will return a value to its previous middleware (for the first middleware, its return value will be regarded as the final result).
```javascript
  jMiddleware.use((v, next) => {
    const val = `1-before ${v}`;
    const res = next(val);
    return `${res} 1-after`;
  });
  jMiddleware.use((v, next) => {
    const val = `2-before ${v}`;
    const res = next(val);
    return `${res} 2-after`;
  });
  const res = jMiddleware.startSync('0');
  console.log(res); // 2-before 1-before 0 2-after 1-after
```