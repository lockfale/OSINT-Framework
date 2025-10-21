/**
 * OSINT Framework - Favorites & Export System
 * Allows users to save favorite tools and export collections
 */

class FavoritesManager {
  constructor() {
    this.storageKey = 'osint_favorites';
    this.favorites = this.loadFavorites();
    this.initUI();
  }

  loadFavorites() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
      this.updateBadge();
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  addFavorite(tool) {
    const exists = this.favorites.find(f => f.url === tool.url);
    if (!exists) {
      this.favorites.push({
        name: tool.name,
        url: tool.url,
        category: tool.category || 'Unknown',
        addedAt: new Date().toISOString()
      });
      this.saveFavorites();
      this.showToast(`Added "${tool.name}" to favorites`);
      return true;
    }
    return false;
  }

  removeFavorite(url) {
    const index = this.favorites.findIndex(f => f.url === url);
    if (index !== -1) {
      const removed = this.favorites.splice(index, 1)[0];
      this.saveFavorites();
      this.showToast(`Removed "${removed.name}" from favorites`);
      return true;
    }
    return false;
  }

  isFavorite(url) {
    return this.favorites.some(f => f.url === url);
  }

  getFavorites() {
    return [...this.favorites];
  }

  clearAll() {
    if (confirm('Are you sure you want to clear all favorites?')) {
      this.favorites = [];
      this.saveFavorites();
      this.showToast('All favorites cleared');
      this.closeFavoritesPanel();
    }
  }

  exportAsJSON() {
    const data = {
      exportDate: new Date().toISOString(),
      totalTools: this.favorites.length,
      favorites: this.favorites
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-favorites-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Favorites exported as JSON');
  }

  exportAsMarkdown() {
    let markdown = `# OSINT Framework Favorites\n\n`;
    markdown += `Exported: ${new Date().toLocaleString()}\n`;
    markdown += `Total Tools: ${this.favorites.length}\n\n`;

    // Group by category
    const grouped = this.favorites.reduce((acc, tool) => {
      const category = tool.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(tool);
      return acc;
    }, {});

    for (const [category, tools] of Object.entries(grouped).sort()) {
      markdown += `## ${category}\n\n`;
      tools.forEach(tool => {
        markdown += `- [${tool.name}](${tool.url})\n`;
      });
      markdown += `\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-favorites-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Favorites exported as Markdown');
  }

  exportAsCSV() {
    let csv = 'Name,URL,Category,Added Date\n';
    this.favorites.forEach(tool => {
      csv += `"${tool.name}","${tool.url}","${tool.category}","${tool.addedAt}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-favorites-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Favorites exported as CSV');
  }

  importFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.favorites && Array.isArray(data.favorites)) {
          const imported = data.favorites.filter(tool => {
            return tool.name && tool.url && !this.isFavorite(tool.url);
          });

          this.favorites.push(...imported);
          this.saveFavorites();
          this.showToast(`Imported ${imported.length} new favorites`);
          this.renderFavoritesList();
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        this.showToast('Import failed: Invalid file format', true);
      }
    };
    reader.readAsText(file);
  }

  initUI() {
    // Create favorites button
    const header = document.getElementById('header');
    if (!header) return;

    const favoritesBtn = document.createElement('button');
    favoritesBtn.id = 'favorites-btn';
    favoritesBtn.className = 'favorites-btn';
    favoritesBtn.innerHTML = `
      ⭐ Favorites <span id="favorites-badge" class="favorites-badge">0</span>
    `;
    favoritesBtn.onclick = () => this.openFavoritesPanel();

    const searchContainer = header.querySelector('.search-container');
    if (searchContainer) {
      searchContainer.parentNode.insertBefore(favoritesBtn, searchContainer.nextSibling);
    }

    this.updateBadge();
    this.createFavoritesPanel();
    this.createToastContainer();
  }

  createFavoritesPanel() {
    const panel = document.createElement('div');
    panel.id = 'favorites-panel';
    panel.className = 'favorites-panel';
    panel.innerHTML = `
      <div class="favorites-header">
        <h2>Favorites</h2>
        <button onclick="favoritesManager.closeFavoritesPanel()" class="close-btn">✕</button>
      </div>
      <div class="favorites-controls">
        <button onclick="favoritesManager.exportAsJSON()" class="export-btn">Export JSON</button>
        <button onclick="favoritesManager.exportAsMarkdown()" class="export-btn">Export MD</button>
        <button onclick="favoritesManager.exportAsCSV()" class="export-btn">Export CSV</button>
        <label class="import-btn">
          Import
          <input type="file" id="import-file" accept=".json" onchange="favoritesManager.handleImport(this)" style="display:none">
        </label>
        <button onclick="favoritesManager.clearAll()" class="clear-all-btn">Clear All</button>
      </div>
      <div id="favorites-list" class="favorites-list"></div>
    `;
    document.body.appendChild(panel);
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  openFavoritesPanel() {
    const panel = document.getElementById('favorites-panel');
    if (panel) {
      panel.classList.add('open');
      this.renderFavoritesList();
    }
  }

  closeFavoritesPanel() {
    const panel = document.getElementById('favorites-panel');
    if (panel) {
      panel.classList.remove('open');
    }
  }

  renderFavoritesList() {
    const listEl = document.getElementById('favorites-list');
    if (!listEl) return;

    if (this.favorites.length === 0) {
      listEl.innerHTML = `
        <div class="empty-favorites">
          <p>No favorites yet!</p>
          <p>Click the ⭐ icon next to any tool to add it.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.favorites.map((tool, index) => `
      <div class="favorite-item">
        <div class="favorite-info">
          <strong>${tool.name}</strong>
          <div class="favorite-meta">
            <span class="category">${tool.category}</span>
            <span class="date">Added: ${new Date(tool.addedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="favorite-actions">
          <a href="${tool.url}" target="_blank" class="visit-btn">Visit</a>
          <button onclick="favoritesManager.removeFavorite('${tool.url.replace(/'/g, "\\'")}')" class="remove-btn">Remove</button>
        </div>
      </div>
    `).join('');
  }

  updateBadge() {
    const badge = document.getElementById('favorites-badge');
    if (badge) {
      badge.textContent = this.favorites.length;
      badge.style.display = this.favorites.length > 0 ? 'inline' : 'none';
    }
  }

  handleImport(input) {
    if (input.files && input.files[0]) {
      this.importFromJSON(input.files[0]);
      input.value = ''; // Reset input
    }
  }

  showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Add favorite star to node
  addStarToNode(nodeElement, toolData) {
    const star = document.createElement('span');
    star.className = 'favorite-star';
    star.innerHTML = this.isFavorite(toolData.url) ? '⭐' : '☆';
    star.title = 'Add to favorites';
    star.onclick = (e) => {
      e.stopPropagation();
      if (this.isFavorite(toolData.url)) {
        this.removeFavorite(toolData.url);
        star.innerHTML = '☆';
      } else {
        this.addFavorite(toolData);
        star.innerHTML = '⭐';
      }
    };
    nodeElement.appendChild(star);
  }
}

// Initialize favorites manager
const favoritesManager = new FavoritesManager();

// Make it globally available
window.favoritesManager = favoritesManager;
