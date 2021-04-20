const path = require('path');
const fs = require('fs-extra');
const config = require('../config.json');
const formidable = require('formidable');
const moment = require('moment');
const archiver = require('archiver');
const extract = require('extract-zip');

module.exports = {
  getFullFilePath(filePath, symbol = config.symbol) {
    const fullFilePath = path.resolve(symbol, filePath);
    fs.mkdirpSync(fullFilePath);
    return fullFilePath;
  },
  getFilePathOptions({ uploadPath = config.uploadPath, backupPath = config.backupPath, symbol = config.symbol }) {
    return {
      uploadPath: this.getFullFilePath(uploadPath, symbol),
      backupPath: this.getFullFilePath(backupPath, symbol),
      symbol,
    };
  },
  async removeHistoryFile({ uploadPath }) {
    const removePath = await this.getFullFilePath(uploadPath);
    console.log('删除路径', removePath);
    const result = await fs.readdir(removePath);
    for (let i = 0; i < result.length; i++) {
      const fp = path.join(uploadPath, result[i]);
      fs.removeSync(fp);
    }
  },
  async backupAndArchiveFile({ uploadPath, backupPath }) {
    const source = uploadPath;
    console.log('压缩源路径', source);
    const newZipFile = moment().format('YYYYMMDDHHmmss') + '.zip';
    const target = path.join(backupPath, newZipFile);
    console.log('压缩目标路径', target);

    return new Promise(async (resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level.
      });
      var output = fs.createWriteStream(target);

      output.on('close', function () {
        console.log('压缩文件总计', archive.pointer() + ' total bytes');
        resolve({ backupFilePath: target });
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
          // console.log('当前压缩 filePath', fp);
          // TODO: 递归判断
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
  async uploadFile({ uploadPath, file }) {
    return new Promise((resolve, reject) => {
      try {
        const filePath = path.join(uploadPath, file.name);
        console.log('上传文件路径', filePath);
        fs.createReadStream(file.path)
          .pipe(fs.createWriteStream(filePath))
          .on('error', (err) => {
            reject(err);
          })
          .on('finish', function () {
            resolve({ filePath });
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  async extraFile({ uploadPath, filePath }) {
    // 解压
    await extract(filePath, { dir: uploadPath });
    // 删除
    fs.removeSync(filePath);
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
};
