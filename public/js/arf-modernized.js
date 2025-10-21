/**
 * OSINT Framework - Modernized with D3.js v7 + Search
 */

import * as d3 from 'd3';
import Fuse from 'fuse.js';

const margin = { top: 20, right: 140, bottom: 20, left: 120 };
const width = 1280 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;
const duration = 750;

let root;
let i = 0;
let searchIndex;

// Create tree layout
const tree = d3.tree().size([height, width]);

// Create diagonal path generator
const diagonal = d3.linkHorizontal()
  .x(d => d.y)
  .y(d => d.x);

// Create SVG
const svg = d3.select('#body')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom);

const g = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// Load and initialize data
d3.json('arf.json').then(data => {
  root = d3.hierarchy(data);
  root.x0 = height / 2;
  root.y0 = 0;

  // Initialize search index
  initializeSearch(root);

  // Collapse all nodes initially
  root.children.forEach(collapse);
  update(root);
});

function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function update(source) {
  // Compute the new tree layout
  const treeData = tree(root);
  const nodes = treeData.descendants();
  const links = treeData.links();

  // Normalize for fixed-depth
  nodes.forEach(d => { d.y = d.depth * 180; });

  // Update the nodes
  const node = g.selectAll('g.node')
    .data(nodes, d => d.id || (d.id = ++i));

  // Enter any new nodes
  const nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr('transform', d => \`translate(\${source.y0},\${source.x0})\`)
    .on('click', (event, d) => {
      toggle(d);
      update(d);
    });

  nodeEnter.append('circle')
    .attr('r', 1e-6)
    .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
    .style('stroke', 'steelblue')
    .style('stroke-width', '2px');

  const label = nodeEnter.append('a')
    .attr('target', '_blank')
    .attr('href', d => d.data.url || null);

  label.append('text')
    .attr('dy', '.35em')
    .attr('x', d => d.children || d._children ? -13 : 13)
    .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
    .text(d => d.data.name)
    .style('fill-opacity', 1e-6);

  nodeEnter.append('title')
    .text(d => d.data.description || d.data.name);

  const nodeUpdate = nodeEnter.merge(node);

  nodeUpdate.transition()
    .duration(duration)
    .attr('transform', d => \`translate(\${d.y},\${d.x})\`);

  nodeUpdate.select('circle')
    .attr('r', 6)
    .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
    .attr('cursor', 'pointer');

  nodeUpdate.select('text')
    .style('fill-opacity', 1);

  const nodeExit = node.exit().transition()
    .duration(duration)
    .attr('transform', d => \`translate(\${source.y},\${source.x})\`)
    .remove();

  nodeExit.select('circle').attr('r', 1e-6);
  nodeExit.select('text').style('fill-opacity', 1e-6);

  // Update the links
  const link = g.selectAll('path.link')
    .data(links, d => d.target.id);

  const linkEnter = link.enter().insert('path', 'g')
    .attr('class', 'link')
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal({ source: o, target: o });
    })
    .style('fill', 'none')
    .style('stroke', '#ccc')
    .style('stroke-width', '2px');

  const linkUpdate = linkEnter.merge(link);

  linkUpdate.transition()
    .duration(duration)
    .attr('d', diagonal);

  link.exit().transition()
    .duration(duration)
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    })
    .remove();

  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}

// Search Functionality
function initializeSearch(rootNode) {
  const flatData = [];

  function flatten(node, path = []) {
    const currentPath = [...path, node.data.name];
    flatData.push({
      name: node.data.name,
      url: node.data.url,
      path: currentPath.join(' > '),
      node: node
    });

    if (node.children) {
      node.children.forEach(child => flatten(child, currentPath));
    }
    if (node._children) {
      node._children.forEach(child => flatten(child, currentPath));
    }
  }

  flatten(rootNode);

  searchIndex = new Fuse(flatData, {
    keys: ['name', 'path'],
    threshold: 0.3,
    includeScore: true
  });
}

function performSearch(query) {
  if (!query || query.length < 2) {
    clearSearchResults();
    return;
  }

  const results = searchIndex.search(query);
  displaySearchResults(results);

  if (results.length > 0) {
    expandToNode(results[0].item.node);
  }
}

function displaySearchResults(results) {
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';

  if (results.length === 0) {
    searchResults.innerHTML = '<div class=\"no-results\">No results found</div>';
    searchResults.style.display = 'block';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'search-results-list';

  results.slice(0, 20).forEach(result => {
    const li = document.createElement('li');
    li.innerHTML = \`
      <strong>\${result.item.name}</strong>
      <div class=\"result-path\">\${result.item.path}</div>
    \`;
    li.onclick = () => {
      expandToNode(result.item.node);
      clearSearchResults();
    };
    list.appendChild(li);
  });

  searchResults.appendChild(list);
  searchResults.style.display = 'block';
}

function clearSearchResults() {
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';
  searchResults.style.display = 'none';
}

function expandToNode(targetNode) {
  root.children.forEach(collapse);

  let node = targetNode;
  while (node.parent) {
    if (node.parent._children) {
      node.parent.children = node.parent._children;
      node.parent._children = null;
    }
    node = node.parent;
  }

  update(root);

  g.selectAll('g.node')
    .classed('highlighted', false);

  g.selectAll('g.node')
    .filter(d => d === targetNode)
    .classed('highlighted', true);
}

window.goDark = function() {
  document.body.classList.toggle('dark-Mode');
};

window.performSearch = performSearch;
window.clearSearchResults = clearSearchResults;
