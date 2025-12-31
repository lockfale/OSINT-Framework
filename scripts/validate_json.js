const fs = require('fs');
const path = require('path');

const arfPath = path.join(__dirname, '../public/arf.json');

console.log(`Validating arf.json(Version: 1.0.0)...`);

try {
  const content = fs.readFileSync(arfPath, 'utf8');
  const json = JSON.parse(content);
  
  let valid = true;
  let urlSet = new Set();
  let nameCount = {};
  let duplicateUrls = [];
  let duplicateNames = [];

  function validateNode(node, pathStr) {
    if (!node.name) {
      console.error(`ERROR: Node missing name at ${ pathStr } `);
      valid = false;
    } else {
        // Track Names
        nameCount[node.name] = (nameCount[node.name] || 0) + 1;
        if (nameCount[node.name] === 2) {
             duplicateNames.push(node.name);
        }
    }

    if (!node.type) {
      console.error(`ERROR: Node '${node.name}' missing type at ${ pathStr } `);
      valid = false;
    }

    if (node.type === 'url') {
      if (!node.url) {
        console.error(`ERROR: Node '${node.name}' is type 'url' but missing url field at ${ pathStr } `);
        valid = false;
      } else {
          // Track URLs
          if (urlSet.has(node.url)) {
              duplicateUrls.push({ name: node.name, url: node.url });
              // We don't mark valid=false for dupes, just warn, unless strict mode.
              // But for this task, let's just log them.
          }
          urlSet.add(node.url);
      }
    } else if (node.type === 'folder') {
      if (node.children) {
        node.children.forEach((child, index) => {
          validateNode(child, `${ pathStr } > ${ node.name } `);
        });
      }
    }
  }

  // Root validation
  if (!json.type) {
      console.warn("WARNING: Root missing type.");
  }
  
  // Start traversal
  if (json.children) {
      json.children.forEach(child => validateNode(child, 'Root'));
  }

  if (valid) {
    console.log('Structure Validation: PASSED');
  } else {
    console.error('Structure Validation: FAILED');
  }

  // Report Duplicates
  if (duplicateUrls.length > 0) {
      console.warn(`\n[!] Found ${ duplicateUrls.length } Duplicate URLs: `);
      duplicateUrls.forEach(d => console.warn(`  - "${d.name}": ${ d.url } `));
  } else {
      console.log('Duplicate URLs: NONE');
  }

  // Only report name duplicates if they seem like errors (too many simple names might be okay in different folders)
  // But exact name duplicates in the whole tree might be confusing.
  if (duplicateNames.length > 0) {
      console.warn(`\n[!] Found ${ duplicateNames.length } Duplicate Names(Potential ambiguous nodes): `);
      // duplicateNames.forEach(n => console.warn(`  - "${n}"`));
      console.warn(`  (Run with verbose log to see names if needed)`); 
  }

} catch (e) {
  console.error('CRITICAL: Invalid JSON Syntax');
  console.error(e.message);
  process.exit(1);
}
