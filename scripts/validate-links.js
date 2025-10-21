#!/usr/bin/env node
/**
 * OSINT Framework - Automated Link Validator
 * Checks all URLs in arf.json and reports dead/broken links
 */

import fs from 'fs/promises';
import axios from 'axios';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  timeout: 5000,
  maxConcurrent: 10,
  retryAttempts: 2,
  userAgent: 'OSINT-Framework-LinkValidator/2.0'
};

class LinkValidator {
  constructor() {
    this.results = {
      total: 0,
      working: 0,
      broken: 0,
      skipped: 0,
      details: []
    };
  }

  async loadData() {
    const dataPath = join(__dirname, '../public/arf.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(content);
  }

  extractUrls(node, path = []) {
    const urls = [];

    if (node.url && node.type === 'url') {
      urls.push({
        name: node.name,
        url: node.url,
        path: [...path, node.name].join(' > ')
      });
    }

    if (node.children) {
      for (const child of node.children) {
        urls.push(...this.extractUrls(child, [...path, node.name]));
      }
    }

    return urls;
  }

  async checkUrl(urlData) {
    const { name, url, path } = urlData;

    // Skip manual edit URLs and Google Dorks
    if (name.includes('(M)') || name.includes('(D)')) {
      this.results.skipped++;
      return { ...urlData, status: 'skipped', reason: 'Manual/Dork' };
    }

    for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
      try {
        const response = await axios.head(url, {
          timeout: CONFIG.timeout,
          headers: { 'User-Agent': CONFIG.userAgent },
          maxRedirects: 5,
          validateStatus: (status) => status < 500
        });

        if (response.status >= 200 && response.status < 400) {
          this.results.working++;
          return { ...urlData, status: 'working', statusCode: response.status };
        } else {
          this.results.broken++;
          return { ...urlData, status: 'broken', statusCode: response.status };
        }
      } catch (error) {
        if (attempt === CONFIG.retryAttempts) {
          this.results.broken++;
          return {
            ...urlData,
            status: 'broken',
            error: error.code || error.message
          };
        }
        // Retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async validateAll() {
    console.log(chalk.blue('🔍 OSINT Framework Link Validator\\n'));

    const data = await this.loadData();
    const urls = this.extractUrls(data);
    this.results.total = urls.length;

    console.log(chalk.cyan(`Found ${urls.length} URLs to validate\\n`));

    // Process in batches
    for (let i = 0; i < urls.length; i += CONFIG.maxConcurrent) {
      const batch = urls.slice(i, i + CONFIG.maxConcurrent);
      const batchResults = await Promise.all(batch.map(u => this.checkUrl(u)));

      this.results.details.push(...batchResults);

      // Display progress
      for (const result of batchResults) {
        if (result.status === 'working') {
          console.log(chalk.green(`✓ ${result.name}`));
        } else if (result.status === 'broken') {
          console.log(chalk.red(`✗ ${result.name} (${result.error || result.statusCode})`));
        } else {
          console.log(chalk.gray(`⊘ ${result.name} (${result.reason})`));
        }
      }

      // Show progress
      const progress = Math.min(i + CONFIG.maxConcurrent, urls.length);
      console.log(chalk.dim(`Progress: ${progress}/${urls.length}\\n`));
    }

    this.displaySummary();
    await this.saveReport();
  }

  displaySummary() {
    console.log('\\n' + '='.repeat(60));
    console.log(chalk.bold('VALIDATION SUMMARY'));
    console.log('='.repeat(60));
    console.log(`Total URLs: ${this.results.total}`);
    console.log(chalk.green(`✓ Working: ${this.results.working}`));
    console.log(chalk.red(`✗ Broken: ${this.results.broken}`));
    console.log(chalk.gray(`⊘ Skipped: ${this.results.skipped}`));
    console.log('='.repeat(60) + '\\n');

    if (this.results.broken > 0) {
      console.log(chalk.red.bold('BROKEN LINKS:'));
      const broken = this.results.details.filter(r => r.status === 'broken');
      broken.forEach(item => {
        console.log(chalk.red(`  • ${item.name}`));
        console.log(chalk.dim(`    ${item.url}`));
        console.log(chalk.dim(`    Error: ${item.error || item.statusCode}\\n`));
      });
    }
  }

  async saveReport() {
    const reportPath = join(__dirname, '../reports/link-health.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        working: this.results.working,
        broken: this.results.broken,
        skipped: this.results.skipped,
        healthScore: ((this.results.working / (this.results.total - this.results.skipped)) * 100).toFixed(2) + '%'
      },
      brokenLinks: this.results.details.filter(r => r.status === 'broken'),
      allResults: this.results.details
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.blue(`📊 Report saved to: ${reportPath}`));
  }
}

// Run validator
const validator = new LinkValidator();
validator.validateAll().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
