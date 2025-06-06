const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    content: './src/content-bundled.js',
    background: './src/background.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
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
    minimize: false // Keep readable for debugging
  }
}; 