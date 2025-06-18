class WeChatEditor {
    constructor() {
        this.quill = null;
        this.turndownService = null;
        this.config = new EditorConfig();
        this.isSourceMode = false;
        this.sourceEditor = null;
        this.initializeTheme();
        this.initializeEditor();
        this.initializeEventListeners();
        this.initializeTurndown();
        this.loadServerConfig();
    }

    initializeTheme() {
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('editorTheme') || 'light';
        this.setTheme(savedTheme);
        
        // Theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                this.setTheme(newTheme);
            });
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('editorTheme', theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    initializeEditor() {
        // Quill editor configuration
        this.quill = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Start writing your WeChat article...'
        });

        // Auto-update preview on content change
        this.quill.on('text-change', () => {
            this.updatePreview();
        });

        // Initialize source editor
        this.sourceEditor = document.getElementById('source-editor');
        this.sourceEditor.addEventListener('input', () => {
            if (this.isSourceMode) {
                this.updatePreviewFromSource();
            }
        });
    }

    initializeTurndown() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        // Custom rules for better conversion
        this.turndownService.addRule('strikethrough', {
            filter: ['del', 's', 'strike'],
            replacement: content => `~~${content}~~`
        });

        this.turndownService.addRule('underline', {
            filter: 'u',
            replacement: content => `<u>${content}</u>`
        });
    }

    initializeEventListeners() {
        // Import button
        document.getElementById('import-btn').addEventListener('click', () => {
            this.showImportModal();
        });

        // Preview button
        document.getElementById('preview-btn').addEventListener('click', () => {
            this.updatePreview();
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Publish button
        document.getElementById('publish-btn').addEventListener('click', () => {
            this.showPublishModal();
        });

        // Import modal events
        document.getElementById('import-confirm').addEventListener('click', () => {
            this.importContent();
        });

        document.getElementById('import-cancel').addEventListener('click', () => {
            this.hideImportModal();
        });

        // Publish modal events
        document.getElementById('publish-confirm').addEventListener('click', () => {
            this.publishToStrapi();
        });

        document.getElementById('publish-cancel').addEventListener('click', () => {
            this.hidePublishModal();
        });

        // Settings modal events
        document.getElementById('settings-save').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('settings-cancel').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('test-connection').addEventListener('click', () => {
            this.testStrapiConnection();
        });

        // Handle token field focus/input to allow editing
        document.getElementById('strapi-token').addEventListener('focus', (e) => {
            this.handleTokenFieldFocus(e);
        });

        // Mode switching
        document.getElementById('visual-mode').addEventListener('click', () => {
            this.switchToVisualMode();
        });

        document.getElementById('source-mode').addEventListener('click', () => {
            this.switchToSourceMode();
        });

        // Image upload
        document.getElementById('upload-image').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });

        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Image processing dialog
        document.getElementById('image-process-confirm').addEventListener('click', () => {
            this.confirmImageProcessing();
        });

        document.getElementById('image-process-cancel').addEventListener('click', () => {
            this.hideImageProcessingDialog();
        });

        // Option card selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option-card')) {
                this.selectImageOption(e.target.closest('.option-card'));
            }
        });

        // Auto-generate slug when title changes
        document.getElementById('article-title').addEventListener('input', async (e) => {
            if (e.target.value.trim()) {
                const slug = await this.generateSlugOnServer(e.target.value);
                document.getElementById('article-slug').value = slug;
            } else {
                document.getElementById('article-slug').value = '';
            }
        });

        // Close modals on background click
        document.getElementById('import-modal').addEventListener('click', (e) => {
            if (e.target.id === 'import-modal') {
                this.hideImportModal();
            }
        });

        document.getElementById('publish-modal').addEventListener('click', (e) => {
            if (e.target.id === 'publish-modal') {
                this.hidePublishModal();
            }
        });

        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                this.hideSettingsModal();
            }
        });

        // Enhanced paste event handling for rich HTML
        this.quill.root.addEventListener('paste', (e) => {
            this.handleRichPaste(e);
        });
    }

    handlePasteConversion() {
        const delta = this.quill.getContents();
        const html = this.quill.root.innerHTML;
        
        // Check if pasted content looks like HTML
        if (this.isHtmlContent(html)) {
            const markdown = this.turndownService.turndown(html);
            this.quill.setText('');
            this.insertMarkdownAsQuill(markdown);
        }
    }

    isHtmlContent(content) {
        // Simple heuristic to detect HTML content
        const htmlTags = /<[^>]+>/g;
        const tagCount = (content.match(htmlTags) || []).length;
        return tagCount > 2; // More than just paragraph tags
    }

    insertMarkdownAsQuill(markdown) {
        // Convert markdown to HTML first, then insert into Quill
        const html = marked.parse(markdown);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Clear editor and insert new content
        this.quill.setText('');
        this.quill.clipboard.dangerouslyPasteHTML(html);
        this.updatePreview();
    }

    updatePreview() {
        let html;
        if (this.isSourceMode) {
            // Convert markdown to HTML for preview
            html = marked.parse(this.sourceEditor.value);
        } else {
            html = this.quill.root.innerHTML;
        }
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = html;
    }

    updatePreviewFromSource() {
        const markdown = this.sourceEditor.value;
        const html = marked.parse(markdown);
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = html;
    }

    switchToVisualMode() {
        if (!this.isSourceMode) return;

        // Convert source to visual
        const markdown = this.sourceEditor.value;
        if (markdown.trim()) {
            const html = marked.parse(markdown);
            this.quill.root.innerHTML = html;
        }

        // Update UI
        this.isSourceMode = false;
        document.getElementById('editor-container').style.display = 'block';
        document.getElementById('source-editor').style.display = 'none';
        document.getElementById('visual-mode').classList.add('active');
        document.getElementById('source-mode').classList.remove('active');
        
        this.updatePreview();
    }

    switchToSourceMode() {
        if (this.isSourceMode) return;

        // Convert visual to source
        const html = this.quill.root.innerHTML;
        const markdown = this.turndownService.turndown(html);
        this.sourceEditor.value = markdown;

        // Update UI
        this.isSourceMode = true;
        document.getElementById('editor-container').style.display = 'none';
        document.getElementById('source-editor').style.display = 'block';
        document.getElementById('visual-mode').classList.remove('active');
        document.getElementById('source-mode').classList.add('active');
        
        this.updatePreview();
    }

    async handleRichPaste(e) {
        e.preventDefault();
        
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        // Check for images first
        const items = Array.from(clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length > 0) {
            for (const item of imageItems) {
                const file = item.getAsFile();
                if (file) {
                    await this.insertImageFromFile(file);
                }
            }
            return;
        }

        // Handle HTML content
        const htmlData = clipboardData.getData('text/html');
        const textData = clipboardData.getData('text/plain');

        if (htmlData) {
            // Process rich HTML content
            await this.processRichHTML(htmlData);
        } else if (textData) {
            // Handle plain text
            if (this.isSourceMode) {
                this.insertTextAtCursor(this.sourceEditor, textData);
            } else {
                this.quill.clipboard.dangerouslyPasteHTML(textData);
            }
        }
    }

    async processRichHTML(html) {
        // Create a temporary DOM to process the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Find images and add processing options
        const images = tempDiv.querySelectorAll('img');
        if (images.length > 0) {
            const shouldProcess = await this.showImageProcessingDialog(images.length);
            
            if (shouldProcess.action !== 'keep') {
                for (const img of images) {
                    try {
                        if (shouldProcess.action === 'upload' && this.config.isConfigured()) {
                            // Convert to blob and upload to Strapi
                            const blob = await this.urlToBlob(img.src);
                            if (blob) {
                                // Convert blob to file for upload
                                const file = new File([blob], 'pasted-image.jpg', { type: blob.type });
                                const integration = new SimpleStrapiIntegration(this.config.getStrapiConfig());
                                const uploadResult = await integration.uploadImage(file);
                                img.src = `${this.config.getStrapiConfig().baseUrl}${uploadResult.url}`;
                            }
                        } else if (shouldProcess.action === 'base64') {
                            // Convert to base64
                            const dataUrl = await this.urlToDataUrl(img.src);
                            if (dataUrl) {
                                img.src = dataUrl;
                            }
                        }
                        // For 'keep' action, we don't modify the src
                    } catch (error) {
                        console.warn('Failed to process image:', img.src, error);
                        // Keep original src as fallback
                    }
                }
            }
        }

        // Insert the processed HTML
        if (this.isSourceMode) {
            const markdown = this.turndownService.turndown(tempDiv.innerHTML);
            this.insertTextAtCursor(this.sourceEditor, markdown);
            this.updatePreviewFromSource();
        } else {
            this.quill.clipboard.dangerouslyPasteHTML(tempDiv.innerHTML);
            this.updatePreview();
        }
    }

    async processImageSrc(src) {
        // Handle different image sources
        if (src.startsWith('data:')) {
            // Data URL - already in base64 format
            return src;
        } else if (src.startsWith('http')) {
            // External URL - try to fetch and convert to base64
            try {
                const response = await fetch(src);
                const blob = await response.blob();
                return await this.blobToDataURL(blob);
            } catch (error) {
                console.warn('Failed to fetch external image:', src);
                return src; // Fallback to original URL
            }
        } else {
            // Relative or other URLs - keep as is
            return src;
        }
    }

    async handleImageUpload(e) {
        const files = Array.from(e.target.files);
        for (const file of files) {
            await this.insertImageFromFile(file);
        }
        // Clear the input
        e.target.value = '';
    }

    async insertImageFromFile(file) {
        if (!file.type.startsWith('image/')) return;

        const uploadMethod = document.getElementById('upload-method').value;
        
        try {
            let imageSrc, imageMarkdown;
            
            if (uploadMethod === 'strapi') {
                // Upload to Strapi media library
                if (!this.config.isConfigured()) {
                    alert('Please configure Strapi settings first to upload images.');
                    return;
                }
                
                const integration = new SimpleStrapiIntegration(this.config.getStrapiConfig());
                const uploadResult = await integration.uploadImage(file);
                
                // Use the uploaded image URL
                imageSrc = `${this.config.getStrapiConfig().baseUrl}${uploadResult.url}`;
                imageMarkdown = `![${uploadResult.alternativeText || file.name}](${imageSrc})`;
                
                console.log('Image uploaded to Strapi:', uploadResult);
            } else {
                // Convert to base64 (default)
                const dataURL = await this.fileToDataURL(file);
                imageSrc = dataURL;
                imageMarkdown = `![${file.name}](${dataURL})`;
            }
            
            // Insert the image
            if (this.isSourceMode) {
                this.insertTextAtCursor(this.sourceEditor, `\n${imageMarkdown}\n`);
                this.updatePreviewFromSource();
            } else {
                // Insert into Quill
                const range = this.quill.getSelection(true);
                this.quill.insertEmbed(range.index, 'image', imageSrc);
                this.quill.setSelection(range.index + 1);
                this.updatePreview();
            }
        } catch (error) {
            console.error('Error inserting image:', error);
            alert(`Failed to insert image: ${error.message}`);
        }
    }

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    insertTextAtCursor(textarea, text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        
        textarea.value = before + text + after;
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input'));
    }

    async showImageProcessingDialog(imageCount) {
        return new Promise((resolve) => {
            this.imageProcessingResolve = resolve;
            
            // Update image count
            document.getElementById('image-count').textContent = imageCount;
            
            // Reset selections
            document.querySelectorAll('.option-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Disable confirm button
            document.getElementById('image-process-confirm').disabled = true;
            
            // Show modal
            document.getElementById('image-processing-modal').style.display = 'flex';
        });
    }

    selectImageOption(card) {
        // Remove previous selection
        document.querySelectorAll('.option-card').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Select current card
        card.classList.add('selected');
        
        // Enable confirm button
        document.getElementById('image-process-confirm').disabled = false;
        
        // Store selected action
        this.selectedImageAction = card.dataset.action;
    }

    confirmImageProcessing() {
        if (this.selectedImageAction && this.imageProcessingResolve) {
            this.imageProcessingResolve({ action: this.selectedImageAction });
            this.hideImageProcessingDialog();
        }
    }

    hideImageProcessingDialog() {
        document.getElementById('image-processing-modal').style.display = 'none';
        if (this.imageProcessingResolve) {
            this.imageProcessingResolve({ action: 'keep' }); // Default to keep if cancelled
        }
        this.imageProcessingResolve = null;
        this.selectedImageAction = null;
    }

    async urlToBlob(url) {
        try {
            const response = await fetch(url);
            return await response.blob();
        } catch (error) {
            console.warn('Failed to convert URL to blob:', url, error);
            return null;
        }
    }

    async urlToDataUrl(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return await this.blobToDataURL(blob);
        } catch (error) {
            console.warn('Failed to convert URL to data URL:', url, error);
            return null;
        }
    }

    showImportModal() {
        document.getElementById('import-modal').style.display = 'flex';
        document.getElementById('import-content').focus();
    }

    hideImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        document.getElementById('import-content').value = '';
    }

    async showPublishModal() {
        document.getElementById('publish-modal').style.display = 'flex';
        document.getElementById('article-title').focus();
        
        // Pre-fill title if we can extract one from content
        const firstHeading = this.quill.root.querySelector('h1, h2, h3');
        if (firstHeading && !document.getElementById('article-title').value) {
            const title = firstHeading.textContent.trim();
            document.getElementById('article-title').value = title;
            const slug = await this.generateSlugOnServer(title);
            document.getElementById('article-slug').value = slug;
        }
    }

    hidePublishModal() {
        document.getElementById('publish-modal').style.display = 'none';
        document.getElementById('article-title').value = '';
        document.getElementById('article-slug').value = '';
        document.getElementById('article-description').value = '';
    }

    importContent() {
        const content = document.getElementById('import-content').value.trim();
        if (!content) return;

        try {
            // Detect if content is HTML or Markdown
            if (this.isHtmlContent(content)) {
                // Convert HTML to markdown, then to Quill
                const markdown = this.turndownService.turndown(content);
                this.insertMarkdownAsQuill(markdown);
            } else {
                // Assume it's markdown and convert to HTML for Quill
                this.insertMarkdownAsQuill(content);
            }
            
            this.hideImportModal();
        } catch (error) {
            console.error('Error importing content:', error);
            alert('Error importing content. Please check the format and try again.');
        }
    }

    async publishToStrapi() {
        // Check if Strapi is configured
        if (!this.config.isConfigured()) {
            alert('Please configure Strapi settings first. Click the Settings button to set up your Strapi connection.');
            return;
        }

        const title = document.getElementById('article-title').value.trim();
        const slug = document.getElementById('article-slug').value.trim();
        const description = document.getElementById('article-description').value.trim();

        if (!title) {
            alert('Please enter a title for the article');
            return;
        }

        try {
            // Get content based on current mode
            let html, markdown;
            if (this.isSourceMode) {
                markdown = this.sourceEditor.value;
                html = marked.parse(markdown);
            } else {
                html = this.quill.root.innerHTML;
                markdown = this.turndownService.turndown(html);
            }

            // Generate slug on server if not provided
            const finalSlug = slug || await this.generateSlugOnServer(title);
            
            // Create article data
            const articleData = {
                title: title,
                slug: finalSlug,
                description: description,
                content: markdown,
                htmlContent: html,
                publishedAt: null // This ensures it's saved as draft
            };

            // Use existing Strapi integration
            const result = await this.sendToStrapi(articleData);
            
            if (result.success) {
                alert('Article published as draft successfully!');
                this.hidePublishModal();
            } else {
                throw new Error(result.error || 'Failed to publish article');
            }
        } catch (error) {
            console.error('Error publishing to Strapi:', error);
            alert(`Error publishing to Strapi: ${error.message}`);
        }
    }

    async sendToStrapi(articleData) {
        // Check if Strapi integration is available
        if (typeof window.SimpleStrapiIntegration === 'undefined') {
            throw new Error('Strapi integration not available. Please check configuration.');
        }

        try {
            // Get Strapi configuration from localStorage or use defaults
            const strapiConfig = this.getStrapiConfig();
            const integration = new window.SimpleStrapiIntegration(strapiConfig);
            
            const result = await integration.createArticle(articleData);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getStrapiConfig() {
        return this.config.getStrapiConfig();
    }

    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const strapiConfig = this.config.getStrapiConfig();
        
        // Populate fields with current settings
        document.getElementById('strapi-url').value = strapiConfig.baseUrl || '';
        
        // Mask the token for display - show only last 4 characters
        const token = strapiConfig.apiToken || '';
        const tokenField = document.getElementById('strapi-token');
        if (token === 'server-configured') {
            // Server-configured token - show special mask
            tokenField.value = '****(server configured)';
            tokenField.dataset.originalToken = 'server-configured';
            tokenField.dataset.isMasked = 'true';
            tokenField.placeholder = 'Token configured on server';
        } else if (token) {
            const maskedToken = '*'.repeat(Math.max(0, token.length - 4)) + token.slice(-4);
            tokenField.value = maskedToken;
            tokenField.dataset.originalToken = token; // Store original token
            tokenField.dataset.isMasked = 'true';
        } else {
            tokenField.value = '';
            tokenField.dataset.originalToken = '';
            tokenField.dataset.isMasked = 'false';
        }
        
        document.getElementById('strapi-collection').value = strapiConfig.collectionName || 'articles';
        
        // If server-configured, make fields read-only (except for manual override)
        const isServerConfigured = token === 'server-configured';
        if (isServerConfigured) {
            document.getElementById('strapi-url').readOnly = true;
            document.getElementById('strapi-collection').readOnly = true;
            tokenField.readOnly = true;
            
            // Show info message
            this.showStatusMessage('Configuration loaded from server. Fields are read-only.', 'info');
        } else {
            document.getElementById('strapi-url').readOnly = false;
            document.getElementById('strapi-collection').readOnly = false;
            tokenField.readOnly = false;
            
            // Clear status message
            const statusDiv = document.getElementById('connection-status');
            statusDiv.className = 'status-message';
            statusDiv.textContent = '';
        }
        
        modal.style.display = 'flex';
        if (!isServerConfigured) {
            document.getElementById('strapi-url').focus();
        }
    }

    hideSettingsModal() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    async saveSettings() {
        const baseUrl = document.getElementById('strapi-url').value.trim();
        const tokenField = document.getElementById('strapi-token');
        const collectionName = document.getElementById('strapi-collection').value.trim() || 'articles';

        // Handle token - use original if it's masked and unchanged, or if field was cleared but we have an original
        let apiToken = tokenField.value.trim();
        if (tokenField.dataset.isMasked === 'true' && apiToken.includes('*')) {
            // User didn't change the masked token, use the original
            apiToken = tokenField.dataset.originalToken || '';
        } else if (!apiToken && tokenField.dataset.originalToken) {
            // User cleared the field but we have an original token, keep the original
            apiToken = tokenField.dataset.originalToken;
        }

        // For server-configured tokens, don't allow saving (fields are read-only)
        if (apiToken === 'server-configured') {
            this.showStatusMessage('Configuration is managed by server. Cannot save changes.', 'error');
            return;
        }

        if (!baseUrl || !apiToken) {
            this.showStatusMessage('Please fill in all required fields', 'error');
            return;
        }

        // Normalize URL
        const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

        this.config.setStrapiConfig({
            baseUrl: normalizedUrl,
            apiToken: apiToken,
            collectionName: collectionName
        });

        this.showStatusMessage('Settings saved successfully!', 'success');
        
        // Auto-hide modal after successful save
        setTimeout(() => {
            this.hideSettingsModal();
        }, 1000);
    }

    async testStrapiConnection() {
        const baseUrl = document.getElementById('strapi-url').value.trim();
        const tokenField = document.getElementById('strapi-token');
        const collectionName = document.getElementById('strapi-collection').value.trim() || 'articles';

        // Handle token - use original if it's masked and unchanged, or if field was cleared but we have an original
        let apiToken = tokenField.value.trim();
        if (tokenField.dataset.isMasked === 'true' && apiToken.includes('*')) {
            // User didn't change the masked token, use the original
            apiToken = tokenField.dataset.originalToken || '';
        } else if (!apiToken && tokenField.dataset.originalToken) {
            // User cleared the field but we have an original token, keep the original
            apiToken = tokenField.dataset.originalToken;
        }

        // For server-configured tokens, test using server endpoint
        if (apiToken === 'server-configured') {
            await this.testServerConnection();
            return;
        }

        if (!baseUrl || !apiToken) {
            this.showStatusMessage('Please fill in all fields before testing', 'error');
            return;
        }

        const testBtn = document.getElementById('test-connection');
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;

        try {
            const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const integration = new SimpleStrapiIntegration({
                baseUrl: normalizedUrl,
                apiToken: apiToken,
                collectionName: collectionName
            });

            const success = await integration.testConnection();
            
            if (success) {
                this.showStatusMessage('Connection successful!', 'success');
            } else {
                this.showStatusMessage('Connection failed. Please check your settings.', 'error');
            }
        } catch (error) {
            this.showStatusMessage(`Connection error: ${error.message}`, 'error');
        } finally {
            testBtn.textContent = 'Test Connection';
            testBtn.disabled = false;
        }
    }

    async testServerConnection() {
        const testBtn = document.getElementById('test-connection');
        testBtn.textContent = 'Testing Server Config...';
        testBtn.disabled = true;

        try {
            const response = await fetch('/config/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.showStatusMessage('Server connection successful!', 'success');
                } else {
                    this.showStatusMessage(`Server connection failed: ${result.error}`, 'error');
                }
            } else {
                this.showStatusMessage('Failed to test server connection', 'error');
            }
        } catch (error) {
            this.showStatusMessage(`Server connection error: ${error.message}`, 'error');
        } finally {
            testBtn.textContent = 'Test Connection';
            testBtn.disabled = false;
        }
    }

    showStatusMessage(message, type) {
        const statusDiv = document.getElementById('connection-status');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
    }

    handleTokenFieldFocus(event) {
        const tokenField = event.target;
        
        // If field is masked and contains asterisks, clear it for editing
        if (tokenField.dataset.isMasked === 'true' && tokenField.value.includes('*')) {
            tokenField.value = '';
            tokenField.dataset.isMasked = 'false';
            tokenField.placeholder = 'Enter new API token or leave empty to keep current';
        }
    }

    async loadServerConfig() {
        try {
            const response = await fetch('/config');
            if (response.ok) {
                const serverConfig = await response.json();
                console.log('✅ Server configuration loaded:', serverConfig);
                
                // Update local config if server has configuration
                if (serverConfig.configured) {
                    this.config.setStrapiConfig({
                        baseUrl: '/api', // Always use local proxy for security
                        collectionName: serverConfig.collection,
                        apiToken: 'server-configured' // Placeholder - actual token is on server
                    });
                    console.log('✅ Local config updated with server configuration (using secure proxy)');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error loading server configuration:', error);
        }
    }

    async generateSlugOnServer(text) {
        if (!text || typeof text !== 'string') {
            return 'untitled-article';
        }

        try {
            const response = await fetch('/api/generate-slug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: text })
            });

            if (response.ok) {
                const result = await response.json();
                return result.slug || 'untitled-article';
            } else {
                console.error('Server slug generation failed:', response.status);
                return this.generateSlugFallback(text);
            }
        } catch (error) {
            console.error('Error generating slug on server:', error);
            return this.generateSlugFallback(text);
        }
    }

    generateSlugFallback(text) {
        // Simple fallback for when server is unavailable
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-{2,}/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50) || 'untitled-article';
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeChatEditor();
});

// Make WeChatEditor available globally for debugging
window.WeChatEditor = WeChatEditor;