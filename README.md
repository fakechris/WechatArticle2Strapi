# WechatArticle2Strapi

A Chrome extension that converts WeChat articles into entries in a Strapi CMS. This project follows the requirements outlined in [`PRD.md`](PRD.md).

## Development

1. Clone the repository.
2. Run `npm install` if you plan to extend the project with additional tooling.
3. Load the extension in Chrome:
   - Open `chrome://extensions`.
   - Enable Developer mode.
   - Click "Load unpacked" and select the project folder.
4. Configure your Strapi endpoint and token in the Options page.
5. Open a WeChat article and click the extension icon to extract and send the content to Strapi.

## Files

- `manifest.json` – Chrome extension manifest.
- `src/content.js` – Extracts article content from WeChat pages.
- `src/background.js` – Handles communication with Strapi.
- `src/popup.html`/`src/popup.js` – Popup UI for one‑click upload.
- `src/options.html`/`src/options.js` – Configuration UI for Strapi settings.

## License

MIT
