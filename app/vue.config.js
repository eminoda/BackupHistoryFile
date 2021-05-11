const path = require('path');
module.exports = {
  configureWebpack: {},
  outputDir: path.join(__dirname, '../dist'),
  devServer: {
    // development server port 8000
    port: 8000,
    // If you want to turn on the proxy, please remove the mockjs /src/main.jsL11
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        ws: false,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
};
