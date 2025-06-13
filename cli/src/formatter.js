import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

class OutputFormatter {
  constructor(format = 'json') {
    this.outputFormat = format.toLowerCase();
    this.supportedFormats = ['json', 'text', 'html', 'markdown'];
    
    if (!this.supportedFormats.includes(this.outputFormat)) {
      throw new Error(`Unsupported format: ${format}. Supported: ${this.supportedFormats.join(', ')}`);
    }
  }

  format(article) {
    switch (this.outputFormat) {
      case 'json':
        return this.formatJSON(article);
      case 'text':
        return this.formatText(article);
      case 'html':
        return this.formatHTML(article);
      case 'markdown':
        return this.formatMarkdown(article);
      default:
        return this.formatJSON(article);
    }
  }

  formatJSON(article) {
    return JSON.stringify(article, null, 2);
  }

  formatText(article) {
    const lines = [];
    
    lines.push('═'.repeat(80));
    lines.push(`ARTICLE EXTRACTION RESULTS`);
    lines.push('═'.repeat(80));
    lines.push('');
    
    // Basic information
    lines.push(`Title: ${article.title || 'N/A'}`);
    lines.push(`Author: ${article.author || 'N/A'}`);
    lines.push(`Published: ${article.publishTime || 'N/A'}`);
    lines.push(`URL: ${article.url || 'N/A'}`);
    lines.push(`Extraction Method: ${article.extractionMethod || 'N/A'}`);
    lines.push('');
    
    // Metadata
    if (article.siteName) lines.push(`Site: ${article.siteName}`);
    if (article.language) lines.push(`Language: ${article.language}`);
    if (article.readingTime) lines.push(`Reading Time: ${article.readingTime} minutes`);
    if (article.tags && article.tags.length > 0) {
      lines.push(`Tags: ${article.tags.join(', ')}`);
    }
    lines.push('');
    
    // Content stats
    lines.push('CONTENT STATISTICS');
    lines.push('─'.repeat(40));
    lines.push(`Content Length: ${article.content ? article.content.length : 0} characters`);
    lines.push(`Word Count: ${article.wordCount || 'N/A'}`);
    lines.push(`Images: ${article.images ? article.images.length : 0}`);
    if (article.processedImages) {
      lines.push(`Processed Images: ${article.processedImages.length}`);
    }
    lines.push('');
    
    // Description/Digest
    if (article.digest) {
      lines.push('DESCRIPTION');
      lines.push('─'.repeat(40));
      lines.push(this.wrapText(article.digest, 76));
      lines.push('');
    }
    
    // Content preview
    if (article.content) {
      lines.push('CONTENT PREVIEW');
      lines.push('─'.repeat(40));
      const textContent = this.stripHTML(article.content);
      const preview = textContent.substring(0, 500);
      lines.push(this.wrapText(preview, 76));
      if (textContent.length > 500) {
        lines.push('[... content truncated ...]');
      }
      lines.push('');
    }
    
    // Images
    if (article.images && article.images.length > 0) {
      lines.push('IMAGES');
      lines.push('─'.repeat(40));
      article.images.slice(0, 5).forEach((img, index) => {
        lines.push(`${index + 1}. ${img.src}`);
        if (img.alt) lines.push(`   Alt: ${img.alt}`);
      });
      if (article.images.length > 5) {
        lines.push(`... and ${article.images.length - 5} more images`);
      }
      lines.push('');
    }
    
    // Processing stats
    if (article.extractionStats) {
      lines.push('EXTRACTION STATISTICS');
      lines.push('─'.repeat(40));
      lines.push(`Extracted At: ${article.extractionStats.extractedAt}`);
      lines.push(`Response Size: ${this.formatBytes(article.extractionStats.responseSize)}`);
      if (article.extractionStats.removedElements) {
        lines.push(`Removed Elements: ${article.extractionStats.removedElements}`);
      }
      lines.push('');
    }
    
    lines.push('═'.repeat(80));
    
    return lines.join('\n');
  }

  formatHTML(article) {
    const html = `
<!DOCTYPE html>
<html lang="${article.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(article.title || 'Extracted Article')}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            max-width: 800px; 
            margin: 40px auto; 
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title { 
            font-size: 2em; 
            font-weight: bold; 
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .meta { 
            color: #666; 
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        .tags {
            margin-top: 10px;
        }
        .tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 0.8em;
            margin-right: 5px;
        }
        .content { 
            margin-top: 30px;
            font-size: 1.1em;
        }
        .extraction-info {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 15px;
            margin-top: 30px;
            font-size: 0.9em;
            color: #495057;
        }
        img {
            max-width: 100%;
            height: auto;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${this.escapeHTML(article.title || 'Untitled Article')}</div>
        ${article.author ? `<div class="meta">By: ${this.escapeHTML(article.author)}</div>` : ''}
        ${article.publishTime ? `<div class="meta">Published: ${this.escapeHTML(article.publishTime)}</div>` : ''}
        ${article.siteName ? `<div class="meta">Source: ${this.escapeHTML(article.siteName)}</div>` : ''}
        ${article.readingTime ? `<div class="meta">Reading time: ${article.readingTime} minutes</div>` : ''}
        ${article.url ? `<div class="meta">Original URL: <a href="${this.escapeHTML(article.url)}">${this.escapeHTML(article.url)}</a></div>` : ''}
        
        ${article.tags && article.tags.length > 0 ? `
        <div class="tags">
            ${article.tags.map(tag => `<span class="tag">${this.escapeHTML(tag)}</span>`).join('')}
        </div>
        ` : ''}
    </div>
    
    ${article.digest ? `
    <div class="digest">
        <strong>Summary:</strong> ${this.escapeHTML(article.digest)}
    </div>
    ` : ''}
    
    <div class="content">
        ${article.content || '<p>No content available</p>'}
    </div>
    
    <div class="extraction-info">
        <strong>Extraction Info:</strong><br>
        Method: ${article.extractionMethod || 'Unknown'}<br>
        Extracted: ${article.extractionStats?.extractedAt || new Date().toISOString()}<br>
        Content Length: ${article.content ? article.content.length : 0} characters<br>
        Images: ${article.images ? article.images.length : 0}
    </div>
</body>
</html>`;
    
    return html.trim();
  }

  formatMarkdown(article) {
    const lines = [];
    
    // Title
    lines.push(`# ${article.title || 'Untitled Article'}`);
    lines.push('');
    
    // Metadata
    const metadata = [];
    if (article.author) metadata.push(`**Author:** ${article.author}`);
    if (article.publishTime) metadata.push(`**Published:** ${article.publishTime}`);
    if (article.siteName) metadata.push(`**Source:** ${article.siteName}`);
    if (article.readingTime) metadata.push(`**Reading Time:** ${article.readingTime} minutes`);
    if (article.url) metadata.push(`**URL:** [${article.url}](${article.url})`);
    
    if (metadata.length > 0) {
      lines.push(...metadata);
      lines.push('');
    }
    
    // Tags
    if (article.tags && article.tags.length > 0) {
      lines.push(`**Tags:** ${article.tags.map(tag => `\`${tag}\``).join(', ')}`);
      lines.push('');
    }
    
    // Description
    if (article.digest) {
      lines.push('## Summary');
      lines.push('');
      lines.push(article.digest);
      lines.push('');
    }
    
    // Content
    if (article.content) {
      lines.push('## Content');
      lines.push('');
      // Convert HTML to markdown (basic conversion)
      const textContent = this.htmlToMarkdown(article.content);
      lines.push(textContent);
      lines.push('');
    }
    
    // Extraction info
    lines.push('---');
    lines.push('');
    lines.push('### Extraction Information');
    lines.push('');
    lines.push(`- **Method:** ${article.extractionMethod || 'Unknown'}`);
    lines.push(`- **Extracted:** ${article.extractionStats?.extractedAt || new Date().toISOString()}`);
    lines.push(`- **Content Length:** ${article.content ? article.content.length : 0} characters`);
    lines.push(`- **Images:** ${article.images ? article.images.length : 0}`);
    if (article.wordCount) {
      lines.push(`- **Word Count:** ${article.wordCount}`);
    }
    
    return lines.join('\n');
  }

  async writeToFile(content, filepath) {
    const dir = path.dirname(filepath);
    await fs.ensureDir(dir);
    await fs.writeFile(filepath, content, 'utf8');
  }

  // Helper methods
  stripHTML(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  escapeHTML(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  wrapText(text, width) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  htmlToMarkdown(html) {
    // Basic HTML to Markdown conversion
    return html
      .replace(/<h([1-6])>(.*?)<\/h[1-6]>/gi, (match, level, content) => {
        return '#'.repeat(parseInt(level)) + ' ' + content.trim() + '\n\n';
      })
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim();
  }
}

export default OutputFormatter;