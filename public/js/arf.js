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
      .on("click", function(event, d) { toggle(d); update(d); });

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) {
        if (d._highlighted) return getCSSVar("--color-accent");
        return d._children ? getCSSVar("--color-node-fill-branch") : getCSSVar("--color-node-fill-leaf");
      });

  nodeEnter.append('a')
      .attr("target", "_blank")
      .attr('href', function(d) { return d.data.url; })
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
      .style("stroke-width", function(d) { return d._highlighted ? "2.5px" : "1.5px"; });

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

// Toggle light/dark mode and persist preference.
function goDark() {
  var body = document.body;
  var isLight = body.classList.toggle("light-mode");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = isLight ? "Switch to dark mode" : "Switch to light mode";
  }
  // Re-render to pick up new CSS variable values for D3 inline styles.
  update(root);
}
