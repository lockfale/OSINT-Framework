#!/usr/bin/env node
/**
 * OSINT Framework REST API
 * Provides programmatic access to OSINT tools data
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting (simple in-memory)
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }

  const record = requestCounts.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_WINDOW;
    return next();
  }

  if (record.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  next();
}

app.use(rateLimit);

// Load OSINT data
let osintData = null;
let dataLoadTime = null;

async function loadData() {
  const dataPath = join(__dirname, '../public/arf.json');
  const content = await fs.readFile(dataPath, 'utf-8');
  osintData = JSON.parse(content);
  dataLoadTime = new Date().toISOString();
}

// Initialize data
await loadData();

// Helper functions
function extractAllTools(node, path = [], tools = []) {
  if (node.url && node.type === 'url') {
    tools.push({
      id: Buffer.from(node.url).toString('base64').slice(0, 16),
      name: node.name,
      url: node.url,
      category: path.join(' > '),
      path: [...path, node.name],
      metadata: {
        isManual: node.name.includes('(M)'),
        isDork: node.name.includes('(D)'),
        requiresRegistration: node.name.includes('(R)'),
        isTool: node.name.includes('(T)')
      }
    });
  }

  if (node.children) {
    for (const child of node.children) {
      extractAllTools(child, [...path, node.name], tools);
    }
  }

  return tools;
}

function searchTools(query, tools) {
  const lowerQuery = query.toLowerCase();
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.category.toLowerCase().includes(lowerQuery) ||
    tool.url.toLowerCase().includes(lowerQuery)
  );
}

function getCategories(node, categories = new Set()) {
  if (node.name && node.children) {
    categories.add(node.name);
  }

  if (node.children) {
    for (const child of node.children) {
      getCategories(child, categories);
    }
  }

  return Array.from(categories);
}

// Routes

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    dataLoaded: !!osintData,
    dataLoadTime,
    uptime: process.uptime()
  });
});

/**
 * GET /api/tools
 * Get all OSINT tools
 * Query params:
 *   - category: filter by category
 *   - search: search tools
 *   - limit: max results (default 100)
 *   - offset: pagination offset (default 0)
 */
app.get('/api/tools', (req, res) => {
  try {
    const { category, search, limit = 100, offset = 0 } = req.query;

    let tools = extractAllTools(osintData);

    // Filter by category
    if (category) {
      tools = tools.filter(tool =>
        tool.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Search
    if (search) {
      tools = searchTools(search, tools);
    }

    // Pagination
    const total = tools.length;
    const paginatedTools = tools.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      count: paginatedTools.length,
      tools: paginatedTools
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/tools/:id
 * Get specific tool by ID
 */
app.get('/api/tools/:id', (req, res) => {
  try {
    const tools = extractAllTools(osintData);
    const tool = tools.find(t => t.id === req.params.id);

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json(tool);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/categories
 * Get all categories
 */
app.get('/api/categories', (req, res) => {
  try {
    const categories = getCategories(osintData);
    res.json({
      total: categories.length,
      categories: categories.sort()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/stats
 * Get statistics about the framework
 */
app.get('/api/stats', (req, res) => {
  try {
    const tools = extractAllTools(osintData);
    const categories = getCategories(osintData);

    const stats = {
      totalTools: tools.length,
      totalCategories: categories.length,
      byType: {
        manual: tools.filter(t => t.metadata.isManual).length,
        dorks: tools.filter(t => t.metadata.isDork).length,
        requiresRegistration: tools.filter(t => t.metadata.requiresRegistration).length,
        localTools: tools.filter(t => t.metadata.isTool).length
      },
      topCategories: Object.entries(
        tools.reduce((acc, tool) => {
          const category = tool.path[0] || 'Unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/tree
 * Get complete tree structure
 */
app.get('/api/tree', (req, res) => {
  try {
    res.json(osintData);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/search
 * Advanced search with fuzzy matching
 */
app.get('/api/search', (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const tools = extractAllTools(osintData);
    const results = searchTools(q, tools);

    res.json({
      query: q,
      total: results.length,
      results: results.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/reload
 * Reload data from disk (admin endpoint)
 */
app.post('/api/reload', async (req, res) => {
  try {
    await loadData();
    res.json({ success: true, dataLoadTime });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reload data', message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`OSINT Framework API running on http://localhost:${PORT}`);
  console.log(`Data loaded: ${osintData ? 'Yes' : 'No'}`);
  console.log(`Total tools: ${extractAllTools(osintData).length}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/tools');
  console.log('  GET  /api/tools/:id');
  console.log('  GET  /api/categories');
  console.log('  GET  /api/stats');
  console.log('  GET  /api/tree');
  console.log('  GET  /api/search?q=query');
  console.log('  POST /api/reload');
});

export default app;
