const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');

const arfPath = path.join(__dirname, '../public/arf.json');
const CONCURRENCY = 10;
const TIMEOUT_MS = 5000;

console.log(`Loading arf.json...`);

try {
    const content = fs.readFileSync(arfPath, 'utf8');
    const json = JSON.parse(content);

    let urlsToCheck = [];

    function collectUrls(node, pathStr) {
        if (node.type === 'url' && node.url) {
            urlsToCheck.push({
                name: node.name,
                url: node.url,
                path: pathStr
            });
        }
        if (node.children) {
            node.children.forEach(child => collectUrls(child, `${pathStr} > ${node.name}`));
        }
    }

    if (json.children) {
        json.children.forEach(child => collectUrls(child, 'Root'));
    }

    console.log(`Found ${urlsToCheck.length} URLs to check.`);
    console.log(`Starting checks with concurrency ${CONCURRENCY}...`);

    let currentIndex = 0;
    let activeRequests = 0;
    let deadLinks = [];
    let checkedCount = 0;

    function checkUrl(item) {
        return new Promise((resolve) => {
            let parsedUrl;
            try {
                // Handle spaces and other common issues
                // Encode characters that are valid in URL strings but unsafe for HTTP request paths
                const cleanUrl = item.url.trim().replace(/[ "<>\\^`{|}[\]]/g, (c) => encodeURIComponent(c));
                parsedUrl = new URL(cleanUrl);
            } catch (e) {
                resolve({ status: 'invalid_url', error: e.message });
                return;
            }

            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            const options = {
                method: 'HEAD',
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                timeout: TIMEOUT_MS,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            };

            const req = protocol.request(options, (res) => {
                if (res.statusCode >= 400) {
                    // Retry with GET if HEAD fails (some servers block HEAD)
                    // For simplicity in this script, we'll mark as suspicious/dead
                    if (res.statusCode === 405 || res.statusCode === 403) {
                        // Method Not Allowed - might be alive
                        resolve({ status: 'alive', code: res.statusCode });
                    } else {
                        resolve({ status: 'dead', code: res.statusCode });
                    }
                } else {
                    resolve({ status: 'alive', code: res.statusCode });
                }
            });

            req.on('error', (err) => {
                resolve({ status: 'error', error: err.message });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ status: 'timeout' });
            });

            req.end();
        });
    }

    function next() {
        if (currentIndex >= urlsToCheck.length && activeRequests === 0) {
            // Done
            report();
            return;
        }

        if (currentIndex >= urlsToCheck.length) {
            return;
        }

        while (activeRequests < CONCURRENCY && currentIndex < urlsToCheck.length) {
            const item = urlsToCheck[currentIndex++];
            activeRequests++;

            checkUrl(item).then(result => {
                activeRequests--;
                checkedCount++;

                if (result.status !== 'alive') {
                    process.stdout.write('x');
                    deadLinks.push({ ...item, reason: result.status, code: result.code, error: result.error });
                } else {
                    // process.stdout.write('.');
                }

                // Progress update every 50
                if (checkedCount % 50 === 0) {
                    process.stdout.write(` ${checkedCount}/${urlsToCheck.length}\r`);
                }

                next();
            });
        }
    }

    function report() {
        console.log('\n\n--- Check Complete ---');
        console.log(`Total URLs: ${urlsToCheck.length}`);
        console.log(`Dead/Refused: ${deadLinks.length}`);

        if (deadLinks.length > 0) {
            console.log('\nPotential Dead Links:');
            deadLinks.forEach(d => {
                console.log(`[${d.reason.toUpperCase()}] ${d.code || d.error || ''} - ${d.name}`);
                console.log(`    URL: ${d.url}`);
                console.log(`    Path: ${d.path}`);
            });

            console.log('\nNote: Some "dead" links might just be blocking bots or have timeouts.');
        } else {
            console.log('No broken links found!');
        }
    }

    // Start
    next();

} catch (e) {
    console.error(e);
}
