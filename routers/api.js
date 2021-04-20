const Router = require('@koa/router');
const router = new Router();
const utils = require('../utils');

/**
 * 上传文件
 */
router.post('/upload', async (ctx, next) => {
  // 解析文件
  const { fields, file } = await utils.parseUploadFile(ctx);
  const options = utils.getFilePathOptions(fields);
  console.log('上传目录', options.uploadPath);
  console.log('备份目录', options.backupPath);
  // 备份旧文件
  const { backupFilePath } = await utils.backupAndArchiveFile(options);
  // 删除旧文件
  await utils.removeHistoryFile(options);
  // 上传新文件
  const { filePath } = await utils.uploadFile(Object.assign({}, options, { file }));
  await utils.extraFile(Object.assign({}, options, { filePath }));
  ctx.body = { code: 200, data: Object.assign({}, options, { filePath, backupFilePath }) };
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
