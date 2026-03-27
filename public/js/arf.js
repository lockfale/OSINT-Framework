var margin = [20, 120, 20, 140],
    width = 1280 - margin[1] - margin[3],
    height = 800 - margin[0] - margin[2],
    i = 0,
    duration = 1250,
    root,
    allSearchNodes = [],
    searchMatches = [];

var tree = d3.tree()
    .size([height, width]);

var diagonal = d3.linkHorizontal()
    .x(function(d) { return d.y; })
    .y(function(d) { return d.x; });

var svgW = width + margin[1] + margin[3];
var svgH = height + margin[0] + margin[2];

var svgEl = d3.select("#body").append("svg")
    .attr("viewBox", "0 0 " + svgW + " " + svgH)
    .attr("preserveAspectRatio", "xMidYMid meet");

var zoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on("zoom", function(event) {
      var t = event.transform;
      vis.attr("transform",
        "translate(" + (margin[3] + t.x) + "," + (margin[0] + t.y) + ")" +
        " scale(" + t.k + ")");
    });

svgEl.call(zoom);

// Close panel when clicking SVG background (not a node or link)
svgEl.on("click", function(event) {
  if (event.target === svgEl.node() || event.target.tagName === "svg") {
    closePanel();
  }
});

var vis = svgEl.append("g")
    .attr("transform", "translate(" + margin[3] + "," + margin[0] + ")");

function getCSSVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

// Parse "(T)", "(D)", "(R)", "(M)" suffixes out of a tool name.
// Returns { cleanName: string, badges: string[] }.
var BADGE_TYPES = ['T', 'D', 'R', 'M'];
function parseName(name) {
  var badges = [];
  var clean = name;
  BADGE_TYPES.forEach(function(b) {
    var suffix = ' (' + b + ')';
    if (clean.indexOf(suffix) !== -1) {
      badges.push(b);
      clean = clean.replace(suffix, '');
    }
  });
  return { cleanName: clean, badges: badges };
}

d3.json("arf.json").then(function(json) {
  root = d3.hierarchy(json, function(d) {
    return d && d.children ? d.children.filter(function(c) { return c != null; }) : null;
  });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collect all tool nodes (those with URLs) for search
  allSearchNodes = root.descendants().filter(function(d) {
    return d.data.url;
  });

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);

  // Stretch the viewBox to match the actual rendered aspect ratio so the
  // zoom-to-fill calculation uses the real visible area, not the fixed
  // 1280x800 letterboxed region.
  var rect = svgEl.node().getBoundingClientRect();
  if (rect.width && rect.height) {
    svgH = Math.round(svgW * (rect.height / rect.width));
    svgEl.attr("viewBox", "0 0 " + svgW + " " + svgH);
  }

  // Run tree layout to get final node positions, then compute zoom from data.
  tree(root);
  root.descendants().forEach(function(d) { d.y = d.depth * 180; });
  var visibleNodes = root.descendants();
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  visibleNodes.forEach(function(d) {
    if (d.x < minX) minX = d.x;
    if (d.x > maxX) maxX = d.x;
    if (d.y < minY) minY = d.y;
    if (d.y > maxY) maxY = d.y;
  });
  var pad = 40;
  var bw = (maxY - minY) || 1;
  var bh = (maxX - minX) || 1;
  var k = Math.min((svgW - pad * 2) / bw, (svgH - pad * 2) / bh, 3);
  var cx = (minY + maxY) / 2;
  var cy = (minX + maxX) / 2;
  var tx = pad - minY * k;
  var ty = svgH / 2 - margin[0] - cy * k;
  svgEl.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));

  update(root);
  initSearch();
});

function update(source) {
  tree(root);
  var nodes = root.descendants().reverse();
  var links = root.links();

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", function(event, d) {
        if (d.data.url && !d.children && !d._children) {
          event.preventDefault();
          openPanel(d);
        } else {
          toggle(d);
          update(d);
        }
      });

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) {
        if (d._highlighted) return getCSSVar("--color-accent");
        return d._children ? getCSSVar("--color-node-fill-branch") : getCSSVar("--color-node-fill-leaf");
      });

  nodeEnter.append('a')
      .attr("target", function(d) { return d.data.url && !d.children && !d._children ? null : "_blank"; })
      .attr('href', function(d) { return d.data.url && !d.children && !d._children ? null : d.data.url; })
      .append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .style("fill", function(d) {
        return d.data.free ? getCSSVar("--color-text-primary") : getCSSVar("--color-text-secondary");
      })
      .style("fill-opacity", 1e-6)
      .each(function(d) {
        var parsed = parseName(d.data.name);
        var el = d3.select(this);
        el.append("tspan").text(parsed.cleanName);
        parsed.badges.forEach(function(b) {
          el.append("tspan")
            .attr("dx", "4")
            .style("font-size", "10px")
            .style("fill", getCSSVar("--badge-" + b))
            .text("(" + b + ")");
        });
      });

  nodeEnter.append("title")
    .text(function(d) {
      return d.data.description;
    });

  // Transition nodes to their new position.
  var nodeUpdate = node.merge(nodeEnter).transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", function(d) { return d._highlighted ? 9 : 6; })
      .style("fill", function(d) {
        if (d._highlighted) return getCSSVar("--color-accent");
        return d._children ? getCSSVar("--color-node-fill-branch") : getCSSVar("--color-node-fill-leaf");
      })
      .style("stroke", function(d) {
        return d._panelSelected ? getCSSVar("--color-accent") : getCSSVar("--color-node-stroke");
      })
      .style("stroke-width", function(d) {
        if (d._panelSelected) return "3px";
        return d._highlighted ? "2.5px" : "1.5px";
      });

  nodeUpdate.select("text")
      .style("fill-opacity", 1)
      .style("font-weight", function(d) { return d._highlighted ? "bold" : "normal"; })
      .style("fill", function(d) {
        return d.data.free ? getCSSVar("--color-text-primary") : getCSSVar("--color-text-secondary");
      });

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links
  var link = vis.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      });

  linkEnter.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.merge(linkEnter).transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting links to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children.
function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}

// Zoom the tree so visible nodes fill the SVG viewport (used on mobile init).
function zoomToFill() {
  var bbox = vis.node().getBBox();
  if (!bbox.width || !bbox.height) return;
  var pad = 40;
  var scaleX = (svgW - pad * 2) / bbox.width;
  var scaleY = (svgH - pad * 2) / bbox.height;
  var k = Math.min(scaleX, scaleY, 3);
  var tx = svgW / 2 - (bbox.x + bbox.width / 2) * k - margin[3];
  var ty = svgH / 2 - (bbox.y + bbox.height / 2) * k - margin[0];
  svgEl.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
}

// Auto-pan viewport to center on a node after expand/click.
function zoomToNode(d) {
  var currentK = d3.zoomTransform(svgEl.node()).k;
  var rect = svgEl.node().getBoundingClientRect();
  var svgScale = rect.width / svgW;
  // Use the visible viewport center (accounts for header/nav above the SVG).
  var vpCenterX = rect.width / 2 / svgScale;
  var vpCenterY = (window.innerHeight / 2 - rect.top) / svgScale;
  var tx = vpCenterX - margin[3] - d.y * currentK;
  var ty = vpCenterY - margin[0] - d.x * currentK;
  svgEl.transition().duration(duration)
    .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(currentK));
}

// Client-side search over all tool nodes.
var searchDebounceTimer = null;

function initSearch() {
  var input = document.getElementById("search-input");
  if (!input) return;
  input.addEventListener("input", function() {
    clearTimeout(searchDebounceTimer);
    var query = input.value.trim();
    searchDebounceTimer = setTimeout(function() { doSearch(query); }, 200);
  });

  var results = document.getElementById("search-results");
  if (results) {
    results.addEventListener("click", function(e) {
      var item = e.target.closest(".search-result-item");
      if (!item) return;
      // If the click was on the external link, let it navigate normally
      if (e.target.closest(".search-result-ext")) return;
      var idx = parseInt(item.getAttribute("data-node-idx"), 10);
      if (!isNaN(idx) && searchMatches[idx]) {
        revealNode(searchMatches[idx]);
      }
    });
    results.addEventListener("keydown", function(e) {
      if (e.key !== "Enter") return;
      var item = e.target.closest(".search-result-item");
      if (!item) return;
      if (e.target.closest(".search-result-ext")) return;
      var idx = parseInt(item.getAttribute("data-node-idx"), 10);
      if (!isNaN(idx) && searchMatches[idx]) {
        revealNode(searchMatches[idx]);
      }
    });
  }
}

function doSearch(query) {
  var results = document.getElementById("search-results");
  if (!results) return;

  // Clear highlights whenever the query changes
  root.descendants().forEach(function(n) { n._highlighted = false; });

  if (!query) {
    searchMatches = [];
    results.innerHTML = "";
    results.classList.remove("visible");
    update(root);
    return;
  }

  var lower = query.toLowerCase();
  searchMatches = allSearchNodes.filter(function(d) {
    var name = (d.data.name || "").toLowerCase();
    var desc = (d.data.description || "").toLowerCase();
    return name.indexOf(lower) !== -1 || desc.indexOf(lower) !== -1;
  }).slice(0, 50);

  results.classList.add("visible");

  if (searchMatches.length === 0) {
    results.innerHTML = '<div class="search-no-results">No results found for \u201c' + escapeHtml(query) + '\u201d</div>';
    return;
  }

  var html = searchMatches.map(function(d, idx) {
    var path = d.ancestors().reverse().slice(1, -1).map(function(a) {
      return escapeHtml(a.data.name);
    }).join(" \u203a ");
    var name = escapeHtml(parseName(d.data.name).cleanName);
    var url = safeUrl(d.data.url);
    return '<div class="search-result-item" role="option" tabindex="0" data-node-idx="' + idx + '">' +
      '<div class="search-result-header">' +
      '<span class="search-result-name">' + name + '</span>' +
      (url !== '#' ? '<a class="search-result-ext" href="' + escapeAttr(url) + '" target="_blank" rel="noopener noreferrer" title="Open website">\u2197</a>' : '') +
      '</div>' +
      (path ? '<div class="search-result-path">' + path + '</div>' : '') +
      '</div>';
  }).join("");

  results.innerHTML = html;
}

// Reveal a node in the tree: collapse everything, expand ancestors, highlight and pan to it.
function revealNode(d) {
  // Collapse entire tree
  root.descendants().forEach(function(n) {
    n._highlighted = false;
    if (n.children) {
      n._children = n.children;
      n.children = null;
    }
  });

  // Expand all ancestors from root down to d's parent
  d.ancestors().forEach(function(ancestor) {
    if (ancestor._children) {
      ancestor.children = ancestor._children;
      ancestor._children = null;
    }
  });

  // Highlight the target node
  d._highlighted = true;

  // Re-render and pan
  update(root);
  zoomToNode(d);

  // Close the search dropdown
  var results = document.getElementById("search-results");
  if (results) {
    results.innerHTML = "";
    results.classList.remove("visible");
  }
  var input = document.getElementById("search-input");
  if (input) input.value = "";
  searchMatches = [];
}

function escapeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return (str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safeUrl(url) {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : "#";
}

// === Tool Details Panel ===

var _panelNode = null;

function openPanel(d) {
  var panel = document.getElementById("tool-panel");
  var overlay = document.getElementById("panel-overlay");
  if (!panel) return;

  // If same node clicked again, close it
  if (_panelNode === d) {
    closePanel();
    return;
  }

  // Clear previous selection ring
  if (_panelNode) {
    _panelNode._panelSelected = false;
  }

  _panelNode = d;
  d._panelSelected = true;

  // Generate/store session hash
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    var existing = sessionStorage.getItem("osint-session");
    if (!existing) {
      sessionStorage.setItem("osint-session", crypto.randomUUID());
    }
  }

  // Populate panel
  var parsed = parseName(d.data.name);

  // Title
  var titleEl = document.getElementById("panel-title");
  if (titleEl) titleEl.textContent = parsed.cleanName;

  // Breadcrumb (ancestors from root, skip root and leaf itself)
  var breadcrumbEl = document.getElementById("panel-breadcrumb");
  if (breadcrumbEl) {
    var crumbs = d.ancestors().reverse().slice(1, -1).map(function(a) {
      return escapeHtml(a.data.name);
    });
    if (crumbs.length > 0) {
      breadcrumbEl.innerHTML = crumbs.join(" &rsaquo; ");
      breadcrumbEl.classList.remove("empty");
    } else {
      breadcrumbEl.textContent = "";
      breadcrumbEl.classList.add("empty");
    }
  }

  // Badges: T/D/R/M type badges + status pill + pricing pill
  var badgesEl = document.getElementById("panel-badges");
  if (badgesEl) {
    var badgeHtml = parsed.badges.map(function(b) {
      return '<span class="badge badge-' + b + '">' + b + '</span>';
    }).join("");

    var status = (d.data.status || "unknown").toLowerCase();
    var statusClass = ["live","down","degraded"].indexOf(status) !== -1 ? status : "unknown";
    badgeHtml += '<span class="badge-pill badge-' + statusClass + '">' + escapeHtml(status) + '</span>';

    var pricing = (d.data.pricing || "unknown").toLowerCase();
    var pricingClass = ["free","freemium","paid"].indexOf(pricing) !== -1 ? pricing : "unknown";
    badgeHtml += ' <span class="badge-pill badge-' + pricingClass + '">' + escapeHtml(pricing) + '</span>';

    if (d.data.api === true) {
      badgeHtml += ' <span class="badge-pill badge-api">API</span>';
    }
    if (d.data.invitationOnly === true) {
      badgeHtml += ' <span class="badge-pill badge-invitation-only">Invite Only</span>';
    }
    if (d.data.deprecated === true) {
      badgeHtml += ' <span class="badge-pill badge-deprecated">Deprecated</span>';
    }
    if (d.data.nsfw === true) {
      badgeHtml += ' <span class="badge-pill badge-nsfw">NSFW</span>';
    }

    var region = d.data.region;
    var regionLabel;
    if (!region || region === "global") {
      regionLabel = "Global";
    } else if (Array.isArray(region)) {
      regionLabel = region.map(function(r) { return r.toUpperCase(); }).join(", ");
    } else {
      regionLabel = String(region).toUpperCase();
    }
    badgeHtml += ' <span class="badge-pill badge-region">' + escapeHtml(regionLabel) + '</span>';

    badgesEl.innerHTML = badgeHtml;
    badgesEl.classList.remove("empty");
  }

  // Description (always shown; placeholder when empty)
  var descSection = document.getElementById("panel-description-section");
  var descEl = document.getElementById("panel-description");
  if (descSection && descEl) {
    if (d.data.description) {
      descEl.className = "";
      descEl.textContent = d.data.description;
    } else {
      descEl.className = "panel-placeholder";
      descEl.textContent = "No description available yet.";
    }
    descSection.classList.remove("empty");
  }

  // Usage context: bestFor only (hidden when empty)
  var usageSection = document.getElementById("panel-usage-section");
  var usageEl = document.getElementById("panel-usage");
  if (usageSection && usageEl) {
    if (d.data.bestFor) {
      usageEl.textContent = d.data.bestFor;
      usageSection.classList.remove("empty");
    } else {
      usageEl.textContent = "";
      usageSection.classList.add("empty");
    }
  }

  // Input → Output (separate section, hidden when both empty)
  var ioSection = document.getElementById("panel-io-section");
  var ioEl = document.getElementById("panel-io");
  if (ioSection && ioEl) {
    if (d.data.input || d.data.output) {
      ioEl.textContent = (d.data.input || "") + " \u2192 " + (d.data.output || "");
      ioSection.classList.remove("empty");
    } else {
      ioEl.textContent = "";
      ioSection.classList.add("empty");
    }
  }

  // OPSEC: colored badge + optional note (always shown)
  var opsecSection = document.getElementById("panel-opsec-section");
  var opsecEl = document.getElementById("panel-opsec");
  if (opsecSection && opsecEl) {
    var opsec = (d.data.opsec || "unknown").toLowerCase();
    var opsecClass = ["passive","active"].indexOf(opsec) !== -1 ? opsec : "unknown";
    var opsecHtml = '<div class="opsec-row"><span class="badge-pill badge-' + opsecClass + '">' + escapeHtml(opsec) + '</span>';
    if (d.data.opsecNote) {
      opsecHtml += '<span class="opsec-note">' + escapeHtml(d.data.opsecNote) + '</span>';
    }
    opsecHtml += '</div>';
    opsecEl.innerHTML = opsecHtml;
    opsecSection.classList.remove("empty");
  }

  // Community rating: render vote UI and fetch live score
  _renderVoteUI(d);

  // Report issue: reset buttons for new tool
  _resetReportButtons(d);

  // CTA
  var ctaSection = document.getElementById("panel-cta-section");
  var ctaLink = document.getElementById("panel-open-tool");
  if (ctaSection && ctaLink) {
    var url = safeUrl(d.data.url);
    if (url !== "#") {
      ctaLink.href = url;
      ctaLink.textContent = "Open " + parsed.cleanName + " \u2197";
      ctaSection.classList.remove("empty");

      // Fire-and-forget click tracking via sendBeacon (THE-106)
      // Clone values into closure so they're captured correctly per open
      (function(toolId) {
        ctaLink.onclick = function() {
          if (!navigator.sendBeacon) return;
          var session = sessionStorage.getItem("osint-session") || "";
          var payload = JSON.stringify({
            tool_id: toolId,
            session_hash: session,
            timestamp: Date.now()
          });
          navigator.sendBeacon(
            "/api/track",
            new Blob([payload], { type: "application/json" })
          );
        };
      })(parsed.cleanName);
    } else {
      ctaSection.classList.add("empty");
    }
  }

  // Show panel and overlay
  panel.classList.add("open");
  if (overlay) overlay.classList.add("visible");

  // Re-render to show selection ring
  update(root);
}

function _setPanelSection(sectionId, fieldId, value) {
  var section = document.getElementById(sectionId);
  var field = document.getElementById(fieldId);
  if (!section || !field) return;
  if (value) {
    field.textContent = value;
    section.classList.remove("empty");
  } else {
    field.textContent = "";
    section.classList.add("empty");
  }
}

function closePanel() {
  var panel = document.getElementById("tool-panel");
  var overlay = document.getElementById("panel-overlay");
  if (panel) panel.classList.remove("open");
  if (overlay) overlay.classList.remove("visible");

  if (_panelNode) {
    _panelNode._panelSelected = false;
    _panelNode = null;
  }

  // Re-render to remove selection ring
  if (root) update(root);
}

// Keyboard: Escape closes panels
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    var notesPanel = document.getElementById("notes-panel");
    if (notesPanel && notesPanel.classList.contains("open")) {
      toggleNotesPanel();
    } else {
      closePanel();
    }
  }
});

// Wire close button once DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  var closeBtn = document.getElementById("panel-close");
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
});

// Canvas click: close panel when clicking the SVG background (not a node)
// This is wired after svgEl is created (see below in the zoom setup area).

// === Community Rating (THE-122) ===

/**
 * Render the half-star rating UI for the given node.
 * Supports 0 to 5 in 0.5 increments. Reads cached rating from sessionStorage,
 * then fetches live average from /api/tool-stats.
 */
function _renderVoteUI(d) {
  var toolId = parseName(d.data.name).cleanName;

  var starPositions = document.querySelectorAll("#star-rating .star-pos");
  var zeroBtn = document.querySelector("#star-rating .star-zero-btn");
  var avgEl = document.getElementById("rating-avg");
  var ratingSection = document.getElementById("panel-rating-section");
  if (!starPositions.length || !avgEl) return;

  // Reset state
  _applyStarFill(starPositions, zeroBtn, 0, null);
  avgEl.textContent = "\u2026";
  if (ratingSection) ratingSection.classList.remove("empty");

  // Read cached user rating from sessionStorage
  var cached = sessionStorage.getItem("rating:" + toolId);
  var userRating = cached !== null ? parseFloat(cached) : null;
  if (userRating !== null) _applyStarFill(starPositions, zeroBtn, userRating, userRating);

  // Wire hover and click for zero button
  if (zeroBtn) {
    zeroBtn.onmouseenter = function() { _applyStarFill(starPositions, zeroBtn, 0, userRating); };
    zeroBtn.onmouseleave = function() {
      _applyStarFill(starPositions, zeroBtn, userRating !== null ? userRating : -1, userRating);
    };
    zeroBtn.onclick = function() {
      userRating = _castRating(toolId, 0, userRating, starPositions, zeroBtn, avgEl);
    };
  }

  // Wire hover and click for each half-star click zone
  var clickZones = document.querySelectorAll("#star-rating .star-click");
  Array.prototype.forEach.call(clickZones, function(btn) {
    var val = parseFloat(btn.getAttribute("data-value"));

    btn.onmouseenter = function() { _applyStarFill(starPositions, zeroBtn, val, userRating); };
    btn.onmouseleave = function() {
      _applyStarFill(starPositions, zeroBtn, userRating !== null ? userRating : -1, userRating);
    };
    btn.onclick = function() {
      userRating = _castRating(toolId, val, userRating, starPositions, zeroBtn, avgEl);
    };
  });

  // Fetch live average asynchronously
  fetch("/api/tool-stats?tool_id=" + encodeURIComponent(toolId))
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (!data || !data.ratings) return;
      _updateRatingDisplay(avgEl, data.ratings.average, data.ratings.count);
    })
    .catch(function() { /* best effort */ });
}

/**
 * Apply filled/half-filled/user-rated classes to star icons.
 * @param {NodeList} starPositions - .star-pos elements
 * @param {Element|null} zeroBtn - the 0-star button
 * @param {number} fillUpTo - rating value to highlight up to (0-5, supports 0.5 steps; -1 = nothing)
 * @param {number|null} userRating - the user's saved rating (shown distinctly)
 */
function _applyStarFill(starPositions, zeroBtn, fillUpTo, userRating) {
  if (zeroBtn) {
    zeroBtn.classList.toggle("active", userRating !== null && userRating === 0 && fillUpTo === 0);
  }
  Array.prototype.forEach.call(starPositions, function(pos) {
    var n = parseInt(pos.getAttribute("data-star"), 10);
    var icon = pos.querySelector(".star-icon");
    if (!icon) return;
    var isUserStar = userRating !== null && fillUpTo === userRating;

    icon.classList.remove("filled", "half-filled", "user-rated");
    if (fillUpTo >= n) {
      icon.classList.add("filled");
      if (isUserStar) icon.classList.add("user-rated");
    } else if (fillUpTo >= n - 0.5) {
      icon.classList.add("half-filled");
      if (isUserStar) icon.classList.add("user-rated");
    }
  });
}

/**
 * Cast or toggle a rating (0-5, 0.5 increments).
 * Returns the new userRating value (number or null).
 */
function _castRating(toolId, value, currentRating, starPositions, zeroBtn, avgEl) {
  var session = sessionStorage.getItem("osint-session") || "";
  // Toggle off if clicking the same value
  var newRating = (value === currentRating) ? null : value;

  fetch("/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool_id: toolId, rating: newRating, session_hash: session })
  })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (!data || !data.ok) return;
      var saved = data.userRating;
      if (saved !== null && saved !== undefined) {
        sessionStorage.setItem("rating:" + toolId, String(saved));
      } else {
        saved = null;
        sessionStorage.removeItem("rating:" + toolId);
      }
      _applyStarFill(starPositions, zeroBtn, saved !== null ? saved : -1, saved);
      _updateRatingDisplay(avgEl, data.average, data.count);
    })
    .catch(function() { /* best effort */ });

  return newRating;
}

function _updateRatingDisplay(avgEl, average, count) {
  if (!count || count === 0) {
    avgEl.textContent = "No ratings yet";
    return;
  }
  avgEl.textContent = average.toFixed(1) + " (" + count + ")";
}

// === Issue Reporting (THE-110) ===

/**
 * Reset report buttons for the newly opened tool.
 */
function _resetReportButtons(d) {
  var toolId = parseName(d.data.name).cleanName;
  var feedbackEl = document.getElementById("panel-report-feedback");
  if (feedbackEl) {
    feedbackEl.textContent = "";
    feedbackEl.classList.add("hidden");
  }

  var buttons = document.querySelectorAll(".report-btn");
  buttons.forEach(function(btn) {
    btn.disabled = false;
    btn.onclick = function() { _submitReport(toolId, btn.getAttribute("data-type"), btn, buttons, feedbackEl); };
  });
}

/**
 * Submit a report for a tool.
 */
function _submitReport(toolId, reportType, clickedBtn, allButtons, feedbackEl) {
  var session = sessionStorage.getItem("osint-session") || "";

  // Disable all buttons while request is in-flight
  allButtons.forEach(function(b) { b.disabled = true; });

  fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool_id: toolId, report_type: reportType, session_hash: session })
  })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (feedbackEl) {
        if (data && data.ok) {
          feedbackEl.textContent = data.counted
            ? "Thanks for your report. We\u2019ll review it soon."
            : "You\u2019ve already reported this issue.";
        } else {
          feedbackEl.textContent = "Report failed. Please try again later.";
          // Re-enable on error so user can retry
          allButtons.forEach(function(b) { b.disabled = false; });
        }
        feedbackEl.classList.remove("hidden");
      }
    })
    .catch(function() {
      allButtons.forEach(function(b) { b.disabled = false; });
      if (feedbackEl) {
        feedbackEl.textContent = "Report failed. Please try again later.";
        feedbackEl.classList.remove("hidden");
      }
    });
}

// Toggle light/dark mode and persist preference.
function goDark() {
  var body = document.body;
  var isLight = body.classList.toggle("light-mode");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  var btn = document.getElementById("header-theme-toggle");
  if (btn) {
    btn.textContent = isLight ? "Dark Mode" : "Light Mode";
  }
  // Re-render to pick up new CSS variable values for D3 inline styles.
  update(root);
}

// Notes panel toggle
function toggleNotesPanel() {
  var panel = document.getElementById("notes-panel");
  var overlay = document.getElementById("notes-overlay");
  if (!panel) return;

  var isOpen = panel.classList.toggle("open");
  if (overlay) overlay.classList.toggle("visible", isOpen);

  // Populate panel body on first open
  if (isOpen && !panel._populated) {
    var body = document.getElementById("notes-panel-body");
    var source = document.getElementById("notes-content");
    var legend = document.querySelector(".legend");
    if (body) {
      body.innerHTML = "";
      if (legend) body.innerHTML += legend.innerHTML;
      if (source) body.innerHTML += source.innerHTML;
    }
    panel._populated = true;
  }
}

// Close notes panel when overlay is clicked
(function() {
  var overlay = document.getElementById("notes-overlay");
  if (overlay) {
    overlay.addEventListener("click", function() { toggleNotesPanel(); });
  }
})();
