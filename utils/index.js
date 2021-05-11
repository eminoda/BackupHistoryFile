const path = require('path');
const fs = require('fs-extra');
const config = require('../config.json');
const formidable = require('formidable');
const moment = require('moment');
const archiver = require('archiver');
const extract = require('extract-zip');

module.exports = {
  createConfigDir() {
    const { ISSPWeb_UPLOAD_PATH, ISSPWeb_BACKUP_PATH, CONFIG_UPLOAD_PATH, CONFIG_BACKUP_PATH } = config;
    fs.mkdirpSync(ISSPWeb_UPLOAD_PATH);
    fs.mkdirpSync(ISSPWeb_BACKUP_PATH);
    fs.mkdirpSync(CONFIG_UPLOAD_PATH);
    fs.mkdirpSync(CONFIG_BACKUP_PATH);
    return { ISSPWeb_UPLOAD_PATH, ISSPWeb_BACKUP_PATH, CONFIG_UPLOAD_PATH, CONFIG_BACKUP_PATH };
  },
  initConfigDir() {
    const issp_dir = path.join(process.cwd(), '..', 'ISSP');
    const issp_bak_dir = path.join(process.cwd(), '..', 'ISSP_BAK');
    const issp_upload_dir = path.join(process.cwd(), '..', 'ISSP_UPLOAD');
    fs.mkdirpSync(issp_dir);
    fs.mkdirpSync(issp_bak_dir);
    fs.mkdirpSync(issp_upload_dir);
    return { issp_bak_dir, issp_dir, issp_upload_dir };
  },
  async backup({ source, target, isZip = true, isRemove = true }) {
    const backupPath = path.join(target, moment().format('YYYY-MM-DD_HH_mm_ss'));
    fs.mkdirpSync(backupPath);
    if (!isZip) {
      fs.copySync(source, backupPath);
      if (isRemove) {
        fs.emptyDirSync(source);
      }
      return {
        backupPath,
      };
    } else {
      return new Promise(async (resolve, reject) => {
        const archive = archiver('zip', {
          zlib: { level: 9 }, // Sets the compression level.
        });
        const backupFilePath = path.join(backupPath, 'backup.zip');
        var output = fs.createWriteStream(backupFilePath);

        output.on('close', function () {
          console.log('压缩文件总计', archive.pointer() + ' total bytes');
          if (isRemove) {
            fs.emptyDirSync(source);
          }
          resolve({
            backupPath,
          });
        });

        archive.on('error', function (err) {
          reject(err);
        });

        archive.pipe(output);

        const appendZip = async function (filePath) {
          const result = await fs.readdir(filePath);
          for (let i = 0; i < result.length; i++) {
            const fp = path.join(filePath, result[i]);
            const stat = await fs.statSync(fp);
            if (stat.isDirectory()) {
              archive.directory(fp, result[i]);
            } else {
              archive.append(fs.createReadStream(fp), { name: result[i] });
            }
          }
          archive.finalize();
        };
        appendZip(source);
      });
    }
  },
  parseUploadFile(ctx) {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      maxFileSize: 1024 * 1024 * 100,
      maxFields: 10,
      maxFieldsSize: 1024 * 1024 * 100,
    });
    return new Promise((resolve, reject) => {
      form.parse(ctx.req, (err, fields, files) => {
        try {
          if (err) {
            reject(err);
          } else {
            if (!files.file) {
              throw new Error('file 不能为空');
            }
            resolve({ file: files.file, fields });
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  },
  async uploadFile({ target, source, file }) {
    // 上传至上传临时目录
    // const uploadFilePath = await new Promise((resolve, reject) => {
    //   try {
    //     const filePath = path.join(source, file.name);
    //     console.log('上传文件路径', filePath);
    //     fs.createReadStream(file.path)
    //       .pipe(fs.createWriteStream(filePath))
    //       .on('error', (err) => {
    //         reject(err);
    //       })
    //       .on('finish', function () {
    //         resolve(filePath);
    //       });
    //   } catch (err) {
    //     reject(err);
    //   }
    // });
    // 解压
    await extract(file.path, { dir: target });
    // 删除
    // fs.emptyDirSync(uploadFilePath);
    return target;
  },
  async rollback(filePath, { uploadPath }) {
    const fileName = path.basename(filePath);
    if (!fileName) {
      throw new Error('文件不存在');
    }
    await this.removeHistoryFile({ uploadPath });
    const target = path.join(uploadPath, fileName);
    await fs.copySync(filePath, target);
    await this.extraFile({ uploadPath, filePath: target });
  },
  logger(...args) {
    return `[${moment().format('YYYY-MM-DD HH:mm:ss')}]` + ' ' + args.join(' ');
  },
};
