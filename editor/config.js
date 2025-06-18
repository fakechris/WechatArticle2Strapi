/**
 * Configuration management for the WeChat Editor
 */

class EditorConfig {
    constructor() {
        this.configKey = 'wechatEditorConfig';
        this.loadConfig();
    }

    loadConfig() {
        const stored = localStorage.getItem(this.configKey);
        this.config = stored ? JSON.parse(stored) : this.getDefaultConfig();
    }

    getDefaultConfig() {
        return {
            strapi: {
                baseUrl: 'http://localhost:1337',
                apiToken: '',
                collectionName: 'articles'
            },
            editor: {
                autoSave: true,
                previewMode: 'wechat',
                defaultTitle: '新文章'
            }
        };
    }

    get(key) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            value = value[k];
            if (value === undefined) break;
        }
        return value;
    }

    set(key, value) {
        const keys = key.split('.');
        let target = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        
        target[keys[keys.length - 1]] = value;
        this.saveConfig();
    }

    saveConfig() {
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
    }

    getStrapiConfig() {
        return this.get('strapi');
    }

    setStrapiConfig(config) {
        this.set('strapi', { ...this.get('strapi'), ...config });
    }

    isConfigured() {
        const strapiConfig = this.getStrapiConfig();
        return strapiConfig.baseUrl && strapiConfig.apiToken && strapiConfig.collectionName;
    }
}

window.EditorConfig = EditorConfig;