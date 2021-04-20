const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');

const apiRouter = require('./routers/api');

app.use(bodyParser());
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log(err);
    ctx.status = err.status || 500;
    ctx.body = {
      code: err.status || 500,
      message: err.message,
    };
  }
});

app.use(apiRouter.routes()).use(apiRouter.allowedMethods());

app.listen(3000);
