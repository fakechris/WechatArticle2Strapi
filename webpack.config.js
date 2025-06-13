import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    content: './src/content-bundled.js',
    background: './src/background.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    // 🔧 修复：为Chrome extension设置固定的publicPath
    publicPath: '',
    // 🔧 修复：确保所有资源使用相对路径
    chunkFilename: '[name].js'
  },
  resolve: {
    fallback: {
      "path": false,
      "fs": false,
      "os": false,
      "crypto": false,
      "stream": false,
      "buffer": false,
      "util": false,
      "process": false
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json',
          transform(content) {
            // Fix paths in manifest.json for dist directory
            const manifest = JSON.parse(content.toString());
            manifest.background.service_worker = 'background.js';
            manifest.action.default_popup = 'popup.html';
            manifest.options_page = 'options.html';
            
            // Ensure content scripts point to the correct file
            if (manifest.content_scripts) {
              manifest.content_scripts.forEach(script => {
                if (script.js) {
                  script.js = script.js.map(file => {
                    // Make sure content.js points to the built file
                    if (file === 'content.js') {
                      return 'content.js';
                    }
                    return file;
                  });
                }
              });
            }
            
            return JSON.stringify(manifest, null, 2);
          }
        },
        {
          from: 'src/popup.html',
          to: 'popup.html'
        },
        {
          from: 'src/options.html',
          to: 'options.html'
        },
        {
          from: 'src/options.js',
          to: 'options.js'
        },
        {
          from: 'icons',
          to: 'icons'
        }
      ]
    })
  ],
  optimization: {
    minimize: false, // Keep readable for debugging
    // 🔧 修复：完全禁用代码分割，确保每个入口文件独立，避免消息监听器冲突
    splitChunks: false
  },
  // 🔧 修复：Chrome extension特定的目标配置
  target: 'web',
  // 🔧 修复：避免使用eval，Chrome extension中不允许
  devtool: false
}; 