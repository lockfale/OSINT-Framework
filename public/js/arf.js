var margin = [20, 120, 20, 140],
    width = 1280 - margin[1] - margin[3],
    height = 800 - margin[0] - margin[2],
    i = 0,
    duration = 1250,
    root;

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

d3.json("arf.json").then(function(json) {
  root = d3.hierarchy(json, function(d) {
    return d && d.children ? d.children.filter(function(c) { return c != null; }) : null;
  });
  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  update(root);
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
      .on("click", function(event, d) { toggle(d); update(d); zoomToNode(d); });

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) {
        return d._children ? getCSSVar("--color-node-fill-branch") : getCSSVar("--color-node-fill-leaf");
      });

  nodeEnter.append('a')
      .attr("target", "_blank")
      .attr('href', function(d) { return d.data.url; })
      .append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.data.name; })
      .style("fill", function(d) {
        return d.data.free ? getCSSVar("--color-text-primary") : getCSSVar("--color-text-secondary");
      })
      .style("fill-opacity", 1e-6);

  nodeEnter.append("title")
    .text(function(d) {
      return d.data.description;
    });

  // Transition nodes to their new position.
  var nodeUpdate = node.merge(nodeEnter).transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 6)
      .style("fill", function(d) {
        return d._children ? getCSSVar("--color-node-fill-branch") : getCSSVar("--color-node-fill-leaf");
      });

  nodeUpdate.select("text")
      .style("fill-opacity", 1)
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
  var tx = svgW / 2 - margin[3] - d.y * currentK;
  var ty = svgH / 2 - margin[0] - d.x * currentK;
  svgEl.transition().duration(duration)
    .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(currentK));
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
