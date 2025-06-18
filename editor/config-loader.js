/**
 * Config loader for WeChat Article Editor
 * Fetches server-side configuration and updates the UI
 */

class ConfigLoader {
    constructor() {
        this.serverConfig = null;
        this.loadServerConfig();
    }

    async loadServerConfig() {
        try {
            const response = await fetch('/config');
            if (response.ok) {
                this.serverConfig = await response.json();
                console.log('✅ Server configuration loaded:', this.serverConfig);
                
                // Update the local config if server has configuration
                if (this.serverConfig.configured && window.EditorConfig) {
                    this.updateLocalConfig();
                }
            } else {
                console.warn('⚠️ Failed to load server configuration');
            }
        } catch (error) {
            console.warn('⚠️ Error loading server configuration:', error);
        }
    }

    updateLocalConfig() {
        if (!this.serverConfig || !this.serverConfig.configured) {
            return;
        }

        // Create or get existing config instance
        let config;
        if (window.editorInstance && window.editorInstance.config) {
            config = window.editorInstance.config;
        } else {
            config = new window.EditorConfig();
        }

        // Update config with server values
        config.setStrapiConfig({
            baseUrl: this.serverConfig.strapiUrl,
            collectionName: this.serverConfig.collection,
            apiToken: 'server-configured' // Placeholder - actual token is on server
        });

        console.log('✅ Local config updated with server configuration');
    }

    isServerConfigured() {
        return this.serverConfig && this.serverConfig.configured;
    }

    getServerConfig() {
        return this.serverConfig;
    }
}

// Create global instance
window.configLoader = new ConfigLoader();