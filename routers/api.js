const Router = require('@koa/router');
const router = new Router();
const utils = require('../utils');
const config = require('../config.json');
// const { issp_dir, issp_bak_dir, issp_upload_dir } = utils.initConfigDir();

const { ISSPWeb_UPLOAD_PATH, ISSPWeb_BACKUP_PATH, CONFIG_UPLOAD_PATH, CONFIG_BACKUP_PATH } = utils.createConfigDir();

router.get('/config', (ctx, next) => {
  ctx.body = {
    code: 200,
    data: config,
  };
});

router.post('/deploy/:type', async (ctx, next) => {
  const msg = [];
  // 解析上传文件
  const { fields, file } = await utils.parseUploadFile(ctx);
  msg.push(utils.logger('文件上传成功', `文件名：${file.name}`));
  if (ctx.params.type == 'issp') {
    // 备份历史文件
    const { backupPath } = await utils.backup({
      source: ISSPWeb_UPLOAD_PATH,
      target: ISSPWeb_BACKUP_PATH,
      isZip: true,
      isRemove: true,
    });
    msg.push(utils.logger('历史文件备份成功', `备份目录：${backupPath}`));
    // 发布上传文件
    const deployDir = await utils.uploadFile({ target: ISSPWeb_UPLOAD_PATH, file });
    msg.push(utils.logger('新文件发布成功', `发布目录：${deployDir}`));
  } else {
    // 备份历史文件
    const { backupPath } = await utils.backup({
      source: CONFIG_UPLOAD_PATH,
      target: CONFIG_BACKUP_PATH,
      isZip: true,
      isRemove: true,
    });
    msg.push(utils.logger('历史文件备份成功', `备份目录：${backupPath}`));
    // 发布上传文件
    const deployDir = await utils.uploadFile({ target: CONFIG_UPLOAD_PATH, file });
    msg.push(utils.logger('新文件发布成功', `发布目录：${deployDir}`));
  }

  ctx.body = { code: 200, data: '操作成功', msg };
});

router.post('/rollback', async (ctx, next) => {
  const filePath = ctx.request.body.filePath;
  if (!filePath) {
    throw new Error('恢复文件不存在');
  }
  const options = utils.getFilePathOptions(ctx.request.body);
  await utils.rollback(filePath, options);
  ctx.body = { code: 200, data: '回滚成功' };
});
module.exports = router;
