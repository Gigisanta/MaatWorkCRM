const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join, dirname } = require('path');
const { fileURLToPath } = require('url');

// Find stream-browserify in node_modules
const findStreamBrowserify = () => {
  const path = join(fileURLToPath(import.meta.url), '..', 'node_modules');
  
  // Try to find in pnpm store
  const pnpmPath = join(path, '.pnpm', 'stream-browserify@3.0.0');
  if (existsSync(pnpmPath)) {
    return join(pnpmPath, 'node_modules', 'stream-browserify');
  }
  
  // Try direct path
  const directPath = join(path, 'stream-browserify');
  if (existsSync(directPath)) {
    return directPath;
  }
  
  return null;
};

const streamBrowserifyPath = findStreamBrowserify();
if (!streamBrowserifyPath) {
  console.log('stream-browserify not found, skipping');
  process.exit(0);
}

// Create web subdirectory
const webDir = join(streamBrowserifyPath, 'web');
mkdirSync(webDir, { recursive: true });

// Create index.js that exports from parent
const indexJsContent = "module.exports = require('../');";
writeFileSync(join(webDir, 'index.js'), indexJsContent);

console.log('Created stream-browserify/web/index.js');
