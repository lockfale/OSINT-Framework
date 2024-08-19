// Set up dimensions and margins
const margin = {top: 20, right: 120, bottom: 20, left: 120};
const width = 1280 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select("#tree-container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

// Create a group for the zoomable area
const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create zoom behavior
const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

// Apply zoom behavior to SVG
svg.call(zoom);

let i = 0;
let root;

// Define tree layout
let tree = d3.tree().nodeSize([30, 200]); // Increased node sizing

function update(source, zoomToFit = false) {
    // Compute the new tree layout
    const treeData = tree(root);
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Normalize for fixed-depth and adjust for text width
    nodes.forEach(d => {
        d.y = d.depth * 250; // Increased horizontal spacing
        d.x = d.x * 1.5; // Increased vertical spacing
    });

    // Update nodes
    const node = g.selectAll(".node")
        .data(nodes, d => d.id || (d.id = ++i));

    const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on("click", (event, d) => {
            if (d.children || d._children) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d, true); // Pass true to zoom to the clicked node
            } else if (d.data.url) {
                // Open the URL in a new tab/window
                window.open(d.data.url, '_blank');
            }
        });

        nodeEnter.append("circle")
        .attr("r", 5)
        .style("fill", d => getNodeFill(d))
        .style("stroke", d => getNodeStroke(d))
        .style("stroke-width", 1.5);
    
    nodeEnter.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -13 : 13)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name)
        .style("font-size", "12px")
        .style("fill", d => getTextColor(d))
        .style("font-weight", d => d.data.url ? "bold" : "normal");

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
        .duration(750)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.exit().transition()
        .duration(750)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .remove();

    // Update links
    const link = g.selectAll(".link")
        .data(links, d => d.target.id);

    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    link.transition()
        .duration(750)
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    link.exit().transition()
        .duration(750)
        .attr("d", d3.linkHorizontal()
            .x(d => source.y)
            .y(d => source.x))
        .remove();

    // Store the old positions for transition.
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Zoom to fit the clicked node if zoomToFit is true
    if (zoomToFit) {
        zoomToNode(source);
    }
}

function getNodeFill(d) {
  if (d.data.url) return "#c6dbef";  // Light blue for link nodes
  if (d._children) return "#3182bd";  // Darker blue for collapsed nodes
  if (d.children) return "#fff";  // White for expanded nodes
  return "#fff";  // White for leaves without links
}

function getNodeStroke(d) {
  if (d.data.url) return "#3182bd";  // Darker blue outline for link nodes
  return "#3182bd";  // Blue outline for all other nodes
}

function getTextColor(d) {
  if (d.data.url) return "#3182bd";  // Blue text for link nodes
  return "black";  // Black text for all other nodes
}

function getNodeStroke(d) {
  if (d.data.url) return "#3182bd";  // Darker blue outline for link nodes
  return "#3182bd";  // Blue outline for all other nodes
}

function getTextColor(d) {
  if (d.data.url) return "#3182bd";  // Blue text for link nodes
  return "black";  // Black text for all other nodes
}

g.selectAll(".node")
    .on("mouseover", function(event, d) {
        d3.select(this).select("circle")
            .transition()
            .duration(300)
            .attr("r", 7);
    })
    .on("mouseout", function(event, d) {
        d3.select(this).select("circle")
            .transition()
            .duration(300)
            .attr("r", 5);
    });

function zoomToNode(source) {
  console.log("Zooming to node:", source);
  const bounds = getBounds(source);
  console.log("Calculated bounds:", bounds);

  if (!bounds || bounds.width === 0 || bounds.height === 0) {
      console.error("Invalid bounds calculated. Using node position for zoom.");
      bounds.x0 = bounds.x1 = source.y;
      bounds.y0 = bounds.y1 = source.x;
      bounds.width = bounds.height = 1;
  }

  const fullWidth = width + margin.left + margin.right;
  const fullHeight = height + margin.top + margin.bottom;

  // Add padding to the bounds
  const padding = 100; // Adjust this value to increase/decrease padding
  bounds.x0 -= padding;
  bounds.x1 += padding;
  bounds.y0 -= padding;
  bounds.y1 += padding;
  bounds.width += 2 * padding;
  bounds.height += 2 * padding;

  const widthScale = fullWidth / bounds.width;
  const heightScale = fullHeight / bounds.height;
  let scale = Math.min(widthScale, heightScale);

  // Limit the maximum zoom level
  scale = Math.min(scale, 1.5); // Adjust this value to set the maximum zoom level

  const translate = [
      fullWidth / 2 - scale * (bounds.x1 + bounds.x0) / 2,
      fullHeight / 2 - scale * (bounds.y1 + bounds.y0) / 2
  ];

  console.log("Applying transform:", { translate, scale });

  svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
  );
}

function getBounds(source) {
    if (!source) return null;

    let left = source, right = source, top = source, bottom = source;
    
    if (source.children) {
        source.children.forEach(child => {
            const childBounds = getBounds(child);
            if (childBounds) {
                if (childBounds.x0 < left.y) left = child;
                if (childBounds.x1 > right.y) right = child;
                if (childBounds.y0 < top.x) top = child;
                if (childBounds.y1 > bottom.x) bottom = child;
            }
        });
    }
    
    return {
        x0: left.y,
        y0: top.x,
        x1: right.y,
        y1: bottom.x,
        width: right.y - left.y,
        height: bottom.x - top.x
    };
}

// Initial render
d3.json("arf.json").then(function(data) {
    root = d3.hierarchy(data);
    
    root.x0 = height / 2;
    root.y0 = 0;

    // Collapse all nodes initially
    root.descendants().forEach(d => {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        }
    });
    
    update(root);

    // Initial centering of the tree
    zoomToNode(root);
}).catch(function(error) {
    console.error("Error loading the JSON file:", error);
});