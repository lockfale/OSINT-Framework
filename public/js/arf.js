var margin = [20, 120, 20, 140],
    i = 0,
    duration = 750,
    root,
    allNodes = [];

var tree, diagonal, vis;

function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function redraw() {
    d3.select("#body svg").remove();

    var container = d3.select("#body").node();
    var width = container.clientWidth;
    var height = container.clientHeight;

    tree = d3.layout.tree();

    diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    vis = d3.select("#body").append("svg:svg")
        .attr("width", width)
        .attr("height", height)
      .append("svg:g")
        .attr("transform", "translate(" + margin[3] + "," + margin[0] + ")");
    
    update(root);
}

d3.json("arf.json", function(json) {
  root = json;
  
  // Pre-process data: assign parent references and unique IDs
  var nodeIdCounter = 0;
  function processData(node, parent) {
      node.id = ++nodeIdCounter;
      node.parent = parent;
      allNodes.push(node);
      var children = node.children ? node.children : (node._children ? node._children : []);
      children.forEach(function(child) {
          processData(child, node);
      });
  }
  processData(root, null);
  
  // Populate autocompletion datalist
  var uniqueNodeNames = [...new Set(allNodes.map(function(n) { return n.name; }))];
  var datalist = d3.select("#search-suggestions");
  uniqueNodeNames.forEach(function(name) {
      datalist.append("option").attr("value", name);
  });

  root.x0 = 800 / 2; // Initial position, will be updated
  root.y0 = 0;

  root.children.forEach(collapse);
  redraw();
  d3.select("#loader").style("display", "none");
  d3.select(window).on("resize", redraw);
});

function update(source) {
  var container = d3.select("#body").node();
  var height = container.clientHeight;
  
  var nodes = tree.nodes(root).reverse();
  
  var maxDepth = 0;
  nodes.forEach(function(d) {
      if (d.depth > maxDepth) {
          maxDepth = d.depth;
      }
  });
  
  var requiredWidth = (maxDepth * 240) + margin[1] + margin[3] + 300; // Adjusted for labels
  var newWidth = Math.max(container.clientWidth, requiredWidth);

  d3.select("#body svg").attr("width", newWidth);
  
  tree.size([height - margin[0] - margin[2], newWidth - margin[3] - margin[1]]);

  // Re-calculate nodes with the new size. This is necessary for correct positioning.
  nodes = tree.nodes(root).reverse();

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 240; }); // Increased depth spacing

  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", function(d) { toggle(d); update(d); });

  nodeEnter.append("svg:circle")
      .attr("r", 1e-6);

  nodeEnter.append('a')
      .attr("target", "_blank")
      .attr('xlink:href', function(d) { return d.url; })
      .append("svg:text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .style("fill: rgb(0, 0, 0)", function(d) { return d.free ? 'black' : '#999'; })
      .style("fill-opacity", 1e-6);

  nodeEnter.append("svg:title")
    .text(function(d) {
      return d.description;
    });

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 6)
      .style("fill", function(d) { return d._children ? "var(--primary-color)" : "#fff"; })
      .style("stroke", "var(--primary-color)");

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
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

// Toggle Dark Mode
function goDark() {
  var element = document.body;
  element.classList.toggle("dark-mode");
}

function search(searchTerm) {
    var lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    // Find all matching nodes
    var matchedNodes = allNodes.filter(function(d) {
        return d.name.toLowerCase().includes(lowerCaseSearchTerm) || 
               (d.description && d.description.toLowerCase().includes(lowerCaseSearchTerm));
    });

    // Expand the parents of matched nodes
    var nodesToExpand = new Set();
    matchedNodes.forEach(function(d) {
        var current = d.parent;
        while(current) {
            nodesToExpand.add(current);
            current = current.parent;
        }
    });

    nodesToExpand.forEach(function(d) {
        if (d._children) {
            toggle(d);
        }
    });
    
    update(root); // Redraw the tree with expanded nodes

    // Highlight the matched nodes and their ancestors
    var nodesToHighlight = new Set(matchedNodes);
    matchedNodes.forEach(function(d){
        var current = d;
        while(current){
            nodesToHighlight.add(current);
            current = current.parent;
        }
    });

    vis.selectAll("g.node")
        .style("display", d => nodesToHighlight.has(d) ? "block" : "none");
        
    vis.selectAll("path.link")
        .style("display", d => (nodesToHighlight.has(d.source) && nodesToHighlight.has(d.target)) ? "block" : "none");
}

function clearSearch() {
    vis.selectAll("g.node").style("display", "block");
    vis.selectAll("path.link").style("display", "block");
    // Collapse all nodes back to the initial state
    if (root.children) {
        root.children.forEach(collapse);
    }
    update(root);
}

d3.select("#search").on("input", function() {
    var searchTerm = this.value;
    if (searchTerm.length > 2) {
        search(searchTerm);
    } else {
        clearSearch();
    }
});

d3.select("#clear-search").on("click", function() {
    d3.select("#search").property("value", "");
    clearSearch();
});

d3.select("#menu-toggle").on("click", function() {
    d3.select("#sidebar").classed("visible", !d3.select("#sidebar").classed("visible"));
});

d3.select("#main-content").on("click", function() {
    if (d3.select("#sidebar").classed("visible")) {
        // Check if the click was outside the sidebar and not on the menu toggle
        if (!d3.event.target.closest("#sidebar") && !d3.event.target.closest("#menu-toggle")) {
            d3.select("#sidebar").classed("visible", false);
        }
    }
});