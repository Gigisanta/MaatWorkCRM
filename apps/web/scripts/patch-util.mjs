// Post-build script to patch util.mjs with TextEncoder
import fs from 'fs';
import path from 'path';

const utilPath = path.resolve('.vercel/output/functions/__server.func/_libs/util.mjs');

if (fs.existsSync(utilPath)) {
  let content = fs.readFileSync(utilPath, 'utf8');
  
  // Check if already patched
  if (!content.includes('TextEncoder')) {
    // Add TextEncoder import and assignment
    const patch = `
import { TextEncoder as TextEncoderPolyfill, TextDecoder as TextDecoderPolyfill } from 'node:util';
`;
    
    // Find the util object declaration and add TextEncoder to it
    content = content.replace(
      'var util = {};',
      `var util = {};
util.TextEncoder = TextEncoderPolyfill;
util.TextDecoder = TextDecoderPolyfill;`
    );
    
    // Add the import at the top
    content = patch + content;
    
    fs.writeFileSync(utilPath, content);
    console.log('✓ Patched util.mjs with TextEncoder');
  } else {
    console.log('✓ util.mjs already patched');
  }
} else {
  console.error('✗ util.mjs not found at', utilPath);
  process.exit(1);
}
