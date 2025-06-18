const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { slugify } = require('transliteration');

class EditorServer {
    constructor(port = 8080, configFile = null) {
        this.port = port;
        this.config = null;
        this.loadConfig(configFile);
        this.createServer();
    }

    loadConfig(configFile) {
        if (configFile && fs.existsSync(configFile)) {
            try {
                const configData = fs.readFileSync(configFile, 'utf8');
                this.config = JSON.parse(configData);
                console.log(`✅ Configuration loaded from ${configFile}`);
                console.log(`🔧 Strapi URL: ${this.config.strapiUrl}`);
                console.log(`📦 Collection: ${this.config.collection}`);
            } catch (error) {
                console.error(`❌ Failed to load config: ${error.message}`);
                process.exit(1);
            }
        }
    }

    createServer() {
        this.server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;

            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // Slug generation endpoint (must be before /api/ proxy)
            if (pathname === '/api/generate-slug') {
                this.handleSlugGenerationRequest(req, res);
                return;
            }

            // API proxy endpoints
            if (pathname.startsWith('/api/')) {
                this.handleApiProxy(req, res, pathname);
                return;
            }

            // Config endpoint (safe - no token exposed)
            if (pathname === '/config') {
                this.handleConfigRequest(req, res);
                return;
            }

            // Config test endpoint
            if (pathname === '/config/test') {
                this.handleConfigTestRequest(req, res);
                return;
            }

            // Field mapping endpoint
            if (pathname === '/config/fieldmapping') {
                this.handleFieldMappingRequest(req, res);
                return;
            }

            // Static file serving
            this.handleStaticFile(req, res, pathname);
        });
    }

    async handleApiProxy(req, res, pathname) {
        if (!this.config || !this.config.strapiUrl || !this.config.token) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Strapi not configured' }));
            return;
        }

        try {
            // Extract the Strapi API path
            const strapiPath = pathname.replace('/api/', '');
            const strapiUrl = `${this.config.strapiUrl}/api/${strapiPath}`;
            
            // Parse query parameters
            const parsedUrl = url.parse(req.url, true);
            const queryString = Object.keys(parsedUrl.query).length > 0 
                ? '?' + new URLSearchParams(parsedUrl.query).toString()
                : '';

            let body = '';
            if (req.method === 'POST' || req.method === 'PUT') {
                body = await this.getRequestBody(req);
            }

            const finalUrl = strapiUrl + queryString;
            console.log(`🔗 API Proxy: ${req.method} ${pathname} -> ${finalUrl}`);
            console.log(`📦 Request body:`, body ? body.substring(0, 200) + '...' : 'none');

            // Make request to Strapi with server-side token
            const response = await this.makeHttpRequest(finalUrl, {
                method: req.method,
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json',
                },
                body: body || undefined
            });

            res.writeHead(response.status, { 'Content-Type': 'application/json' });
            res.end(response.body);

        } catch (error) {
            console.error('API Proxy error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }

    handleConfigRequest(req, res) {
        // Return safe config (no token)
        const safeConfig = {
            configured: !!this.config,
            strapiUrl: this.config?.strapiUrl || '',
            collection: this.config?.collection || ''
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeConfig));
    }

    async handleConfigTestRequest(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        if (!this.config || !this.config.strapiUrl || !this.config.token) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: 'Strapi not configured on server' 
            }));
            return;
        }

        try {
            // Test connection by making a simple API call to Strapi
            const testUrl = `${this.config.strapiUrl}/api/${this.config.collection}?pagination[limit]=1`;
            
            console.log(`🧪 Testing Strapi connection to: ${testUrl}`);
            
            const response = await this.makeHttpRequest(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.status === 200 || response.status === 404) {
                // 404 is okay - collection might be empty
                console.log(`✅ Strapi connection test successful (${response.status})`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Connection successful',
                    statusCode: response.status
                }));
            } else if (response.status === 401) {
                console.log(`❌ Strapi connection test failed: Invalid token`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Invalid API token' 
                }));
            } else {
                console.log(`❌ Strapi connection test failed: HTTP ${response.status}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: `HTTP ${response.status}` 
                }));
            }
        } catch (error) {
            console.error(`❌ Strapi connection test error:`, error.message);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        }
    }

    handleFieldMappingRequest(req, res) {
        if (req.method !== 'GET') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        if (!this.config) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                fieldMapping: null,
                error: 'No configuration loaded' 
            }));
            return;
        }

        // Return field mapping and presets configuration
        const mappingConfig = {
            fieldMapping: this.config.fieldMapping || null,
            presets: this.config.fieldPresets || null
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mappingConfig));
    }

    async handleSlugGenerationRequest(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        try {
            const body = await this.getRequestBody(req);
            const { title } = JSON.parse(body);

            if (!title || typeof title !== 'string') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Title is required and must be a string' }));
                return;
            }

            // Generate slug using same logic as CLI
            const slug = this.generateSlug(title);
            
            console.log(`🏷️ Generated slug: "${title}" → "${slug}"`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ slug }));

        } catch (error) {
            console.error('Error generating slug:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }

    generateSlug(text, maxLength = 50) {
        if (!text || typeof text !== 'string') {
            console.warn('[SLUG-DEBUG] Invalid input:', text);
            return 'untitled';
        }

        try {
            // Use transliteration library for Chinese to pinyin conversion (same as CLI)
            let slug = slugify(text, {
                lowercase: true,
                separator: '-',
                trim: true
            });
            
            // Limit length to prevent overly long slugs
            if (slug.length > maxLength) {
                slug = slug.substring(0, maxLength);
                // Try to break at word boundary
                const lastDash = slug.lastIndexOf('-');
                if (lastDash > maxLength * 0.7) {
                    slug = slug.substring(0, lastDash);
                }
            }
            
            console.log(`[SLUG-DEBUG] "${text}" → "${slug}" (length: ${slug.length})`);
            return slug || 'untitled';
        } catch (error) {
            console.error('[SLUG-ERROR] transliteration failed:', error);
            
            // Fallback implementation (same logic as CLI)
            let slug = text
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            // Apply length limit to fallback as well
            if (slug.length > maxLength) {
                slug = slug.substring(0, maxLength);
                const lastDash = slug.lastIndexOf('-');
                if (lastDash > maxLength * 0.7) {
                    slug = slug.substring(0, lastDash);
                }
            }
            
            return slug || 'untitled';
        }
    }

    handleStaticFile(req, res, pathname) {
        // Default to index.html for root
        if (pathname === '/') {
            pathname = '/index.html';
        }

        const filePath = path.join(__dirname, pathname);
        
        // Security check - ensure file is within the directory
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }

            const ext = path.extname(filePath);
            const contentType = this.getContentType(ext);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }

    getContentType(ext) {
        const types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        return types[ext] || 'text/plain';
    }

    getRequestBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
        });
    }

    makeHttpRequest(url, options) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method,
                headers: options.headers
            };

            // Use https for https URLs, http for http URLs
            const requestModule = urlObj.protocol === 'https:' ? https : http;

            const req = requestModule.request(requestOptions, (res) => {
                let body = '';
                res.on('data', chunk => {
                    body += chunk;
                });
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });

            req.on('error', reject);

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 WeChat Article Editor Server running on http://localhost:${this.port}`);
            if (this.config) {
                console.log(`🔐 Secure proxy enabled for Strapi at ${this.config.strapiUrl}`);
            } else {
                console.log(`⚙️  No config loaded - manual configuration required`);
            }
        });
    }
}

// CLI handling
const args = process.argv.slice(2);
let port = 8080;
let configFile = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' || args[i] === '--port') {
        port = parseInt(args[i + 1]);
        i++;
    } else if (args[i] === '-f' || args[i] === '--config') {
        configFile = args[i + 1];
        i++;
    } else if (args[i] === '-h' || args[i] === '--help') {
        console.log('Usage: node server.js [OPTIONS]');
        console.log('Options:');
        console.log('  -f, --config FILE    Load Strapi configuration from JSON file');
        console.log('  -p, --port PORT      Server port (default: 8080)');
        console.log('  -h, --help           Show this help message');
        process.exit(0);
    }
}

// Start server
const server = new EditorServer(port, configFile);
server.start();