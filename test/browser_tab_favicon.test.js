const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('--- Testing Browser Tab Favicon & Brand Icon Integration ---');

const PORT = process.env.PORT || 3005;
const frontendDir = path.join(__dirname, '../frontend');

// 1. Files existence & size checks
const faviconIco = path.join(frontendDir, 'favicon.ico');
const faviconPng = path.join(frontendDir, 'favicon.png');
const masterIcon = path.join(frontendDir, 'vtrade_master_icon.png');
const icon192 = path.join(frontendDir, 'icons/icon-192.png');
const icon512 = path.join(frontendDir, 'icons/icon-512.png');

assert(fs.existsSync(faviconIco), 'favicon.ico must exist in frontend');
assert(fs.existsSync(faviconPng), 'favicon.png must exist in frontend');
assert(fs.existsSync(masterIcon), 'vtrade_master_icon.png must exist in frontend');
assert(fs.existsSync(icon192), 'icons/icon-192.png must exist in frontend');
assert(fs.existsSync(icon512), 'icons/icon-512.png must exist in frontend');

const icoSize = fs.statSync(faviconIco).size;
const pngSize = fs.statSync(faviconPng).size;
const masterSize = fs.statSync(masterIcon).size;

assert(icoSize > 5000, `favicon.ico should be non-empty valid icon asset (was ${icoSize})`);
assert(pngSize > 5000, `favicon.png should be non-empty valid icon asset (was ${pngSize})`);
assert(masterSize > 5000, `vtrade_master_icon.png should be non-empty asset (was ${masterSize})`);
console.log('✓ File existence and size checks passed.');

// 2. index.html head tags check
const indexHtmlPath = path.join(frontendDir, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

assert(indexHtml.includes('rel="icon"'), 'index.html must include <link rel="icon"> tags');
assert(indexHtml.includes('rel="shortcut icon"'), 'index.html must include <link rel="shortcut icon"> for legacy browser tabs');
assert(indexHtml.includes('href="favicon.ico"'), 'index.html must link to favicon.ico');
assert(indexHtml.includes('href="favicon.png"'), 'index.html must link to favicon.png');
assert(indexHtml.includes('vtrade_master_icon.png'), 'index.html must reference vtrade_master_icon.png');
console.log('✓ index.html icon link tags verified in <head>.');

// 3. manifest.json icons check
const manifestPath = path.join(frontendDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest.json must have icons configured');
console.log('✓ manifest.json icons verified.');

// 4. HTTP Endpoint tests against running dev server
function testEndpoint(pathUrl) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${pathUrl}`, (res) => {
      let dataChunks = [];
      res.on('data', chunk => dataChunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          dataLength: Buffer.concat(dataChunks).length
        });
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const icoRes = await testEndpoint('/favicon.ico');
    assert.strictEqual(icoRes.statusCode, 200, '/favicon.ico must return 200 OK');
    assert(icoRes.dataLength > 5000, '/favicon.ico body must not be empty');
    console.log(`✓ GET /favicon.ico -> HTTP 200 OK (${icoRes.dataLength} bytes, content-type: ${icoRes.headers['content-type']})`);

    const pngRes = await testEndpoint('/favicon.png');
    assert.strictEqual(pngRes.statusCode, 200, '/favicon.png must return 200 OK');
    assert.strictEqual(pngRes.headers['content-type'], 'image/png');
    assert(pngRes.dataLength > 5000, '/favicon.png body must not be empty');
    console.log(`✓ GET /favicon.png -> HTTP 200 OK (${pngRes.dataLength} bytes, content-type: image/png)`);

    const masterRes = await testEndpoint('/vtrade_master_icon.png');
    assert.strictEqual(masterRes.statusCode, 200, '/vtrade_master_icon.png must return 200 OK');
    assert.strictEqual(masterRes.headers['content-type'], 'image/png');
    console.log(`✓ GET /vtrade_master_icon.png -> HTTP 200 OK`);

    console.log('ALL BROWSER TAB FAVICON & BRAND ICON TESTS PASSED SUCCESSFULLY! ✓');
    process.exit(0);
  } catch (err) {
    console.error('Favicon test error:', err);
    process.exit(1);
  }
})();
