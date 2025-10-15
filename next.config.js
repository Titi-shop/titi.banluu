// next.config.js
const path = require("path");

module.exports = {
  webpackDevMiddleware: (config) => {
    // 🧹 Bỏ qua theo dõi các file hệ thống Windows
    config.watchOptions.ignored = [
      '**/node_modules/**',
      '**/.next/**',
      'C:/pagefile.sys',
      'C:/hiberfil.sys',
      'C:/swapfile.sys',
      'C:/DumpStack.log.tmp',
    ];
    return config;
  },

  // Cho phép ảnh trong thư mục uploads được load
  images: {
    domains: ["localhost"],
  },
};
