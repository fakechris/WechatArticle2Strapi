/**
 * Browser-compatible Strapi integration for the editor
 * Simplified version of the main Strapi integration
 */

class SimpleStrapiIntegration {
    constructor(config) {
        this.config = {
            baseUrl: config.baseUrl || '/api', // Use local proxy
            apiToken: '', // Not needed - proxy handles auth
            collectionName: config.collectionName || 'articles',
            ...config
        };
        
        this.fieldMapping = null;
        this.fieldPresets = null;
        
        // Load configuration from server
        this.loadConfig();
    }

    async loadConfig() {
        try {
            // Load basic config
            const response = await fetch('/config');
            const serverConfig = await response.json();
            
            if (serverConfig.configured) {
                this.config.collectionName = serverConfig.collection;
                console.log('✅ Server-side Strapi configuration detected');
            }
            
            // Load field mapping config
            const mappingResponse = await fetch('/config/fieldmapping');
            if (mappingResponse.ok) {
                const mappingConfig = await mappingResponse.json();
                this.fieldMapping = mappingConfig.fieldMapping;
                this.fieldPresets = mappingConfig.presets;
                console.log('✅ Field mapping configuration loaded');
            }
        } catch (error) {
            console.warn('Could not load server configuration:', error);
        }
    }

    async createArticle(articleData) {
        const endpoint = `${this.config.baseUrl}/${this.config.collectionName}`;
        
        // Apply field mapping to transform article data
        const mappedData = this.applyFieldMapping(articleData);
        
        // Prepare the data in Strapi v4 format for draft creation
        const strapiData = {
            data: {
                ...mappedData
                // DO NOT include publishedAt field - completely remove it for draft status
            }
        };

        // Use dual strategy for draft creation (same as CLI)
        const draftEndpoint = `${endpoint}?status=draft`;
        
        console.log('Creating draft article with dual strategy');
        console.log('Draft endpoint:', draftEndpoint);
        console.log('Fallback endpoint:', endpoint);
        console.log('Request data:', strapiData);

        try {
            // Strategy 1: Try draft endpoint with status=draft parameter
            console.log('Attempting draft endpoint with status=draft parameter');
            let response = await fetch(draftEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(strapiData)
            });

            if (!response.ok) {
                console.log('Draft endpoint failed, trying fallback endpoint');
                // Strategy 2: Fallback to regular endpoint
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(strapiData)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Article created successfully as draft:', result);
            return result;
            
        } catch (error) {
            console.error('Error creating article in Strapi:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.config.baseUrl}/${this.config.collectionName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Strapi connection test failed:', error);
            return false;
        }
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('files', file);

        try {
            const response = await fetch(`${this.config.baseUrl}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            return result[0]; // Strapi returns array of uploaded files
        } catch (error) {
            console.error('Error uploading image to Strapi:', error);
            throw error;
        }
    }


    applyFieldMapping(articleData) {
        const fieldMapping = this.fieldMapping;
        const fieldPresets = this.fieldPresets;
        
        if (!fieldMapping || !fieldMapping.enabled) {
            // No field mapping - return original data structure
            return {
                title: articleData.title,
                slug: articleData.slug,
                content: articleData.content,
                summary: articleData.description || ''
            };
        }

        const mappedData = {};
        const fields = fieldMapping.fields || {};

        // Apply field mapping - map from source fields to target fields
        if (fields.title && articleData.title) {
            mappedData[fields.title] = articleData.title;
        }
        
        if (fields.content && articleData.content) {
            mappedData[fields.content] = articleData.content;
        }
        
        if (fields.slug && articleData.slug) {
            mappedData[fields.slug] = articleData.slug;
        }
        
        // Map description to digest field (summary)
        if (fields.digest && articleData.description) {
            mappedData[fields.digest] = articleData.description;
        }

        // Map siteName if available
        if (fields.siteName) {
            mappedData[fields.siteName] = articleData.siteName || 'web';
        }

        // Add any preset fields
        if (fieldPresets && fieldPresets.enabled) {
            const presets = fieldPresets.presets || {};
            for (const [fieldName, preset] of Object.entries(presets)) {
                if (preset.type === 'text' && preset.value) {
                    mappedData[fieldName] = preset.value;
                }
            }
        }

        console.log('Applied field mapping:', mappedData);
        return mappedData;
    }
}

// Browser-compatible slug generator
function generateSlug(text) {
    if (!text || typeof text !== 'string') {
        return 'untitled';
    }

    // Simple Chinese to Pinyin mapping for common characters
    const pinyinMap = {
        '微': 'wei', '信': 'xin', '公': 'gong', '众': 'zhong', '号': 'hao',
        '文': 'wen', '章': 'zhang', '提': 'ti', '取': 'qu', '内': 'nei', '容': 'rong',
        '技': 'ji', '术': 'shu', '人': 'ren', '工': 'gong', '智': 'zhi', '能': 'neng',
        '数': 'shu', '据': 'ju', '分': 'fen', '析': 'xi', '系': 'xi', '统': 'tong',
        '开': 'kai', '发': 'fa', '程': 'cheng', '序': 'xu', '网': 'wang', '站': 'zhan',
        '应': 'ying', '用': 'yong', '软': 'ruan', '件': 'jian', '服': 'fu', '务': 'wu',
        '前': 'qian', '端': 'duan', '后': 'hou', '库': 'ku', '框': 'kuang', '架': 'jia',
        '的': 'de', '是': 'shi', '在': 'zai', '有': 'you', '和': 'he', '与': 'yu',
        '来': 'lai', '去': 'qu', '上': 'shang', '下': 'xia', '会': 'hui', '可': 'ke',
        '以': 'yi', '要': 'yao', '说': 'shuo', '看': 'kan', '做': 'zuo', '想': 'xiang',
        '大': 'da', '小': 'xiao', '新': 'xin', '老': 'lao', '好': 'hao',
        '中': 'zhong', '国': 'guo', '年': 'nian', '月': 'yue', '日': 'ri',
        '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu',
        '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi'
    };

    let slug = text.trim();

    // Convert Chinese characters to pinyin
    slug = slug.replace(/[\u4e00-\u9fff]/g, char => pinyinMap[char] || 'ch');

    // Clean up the slug
    slug = slug
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[，。！？；：""''（）【】《》、]/g, '') // Remove Chinese punctuation
        .replace(/[*+~.()'"!:@]/g, '') // Remove special characters
        .replace(/[,\.\!\?\;\:\"\']/g, '-') // Replace punctuation with dashes
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/-+/g, '-') // Remove multiple dashes
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .toLowerCase();

    // Limit length
    if (slug.length > 60) {
        slug = slug.substring(0, 60);
        const lastDash = slug.lastIndexOf('-');
        if (lastDash > 50) {
            slug = slug.substring(0, lastDash);
        }
    }

    // If empty, use timestamp
    if (!slug || slug.length < 3) {
        slug = `article-${Date.now()}`;
    }

    return slug;
}

// Make available globally
window.SimpleStrapiIntegration = SimpleStrapiIntegration;
window.generateSlug = generateSlug;