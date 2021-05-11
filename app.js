const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const apiRouter = require('./routers/api');

app.use(require('koa-static')(__dirname + '/dist'));
app.use(cors());
app.use(bodyParser({ formLimit: 1024 * 100 }));
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      code: err.status || 500,
      message: err.message,
    };
  }
});

app.use(apiRouter.routes()).use(apiRouter.allowedMethods());

app.listen(3000);
