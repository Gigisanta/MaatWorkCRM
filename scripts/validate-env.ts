/**
 * Script de validacion de variables de entorno.
 * Ejecutar con: npx tsx scripts/validate-env.ts
 *
 * Fallara el build si detecta valores placeholder o debiles.
 */

import { readFileSync } from 'fs';

const DANGEROUS_VALUES = [
  'maatwork-crm-secret-key-for-development-only',
  'dev-jwt-secret-change-in-production',
  'YOUR_',
  'TU_',
  'REEMPLAZAR',
  'CHANGE_IN_PRODUCTION',
  'CHANGE_IN_PROD',
];

const REQUIRED_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'TOKEN_ENCRYPTION_KEY',
];

function validateEnvFile(filepath: string): boolean {
  console.log(`Checking: ${filepath}`);

  try {
    const content = readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    let errors = 0;
    let warnings = 0;

    for (const line of lines) {
      if (line.startsWith('#') || !line.includes('=')) continue;

      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      const trimmedKey = key.trim();

      if (!trimmedKey || !value) continue;

      for (const dangerous of DANGEROUS_VALUES) {
        if (value.includes(dangerous)) {
          console.error(`  ERROR: ${trimmedKey} contains dangerous value "${dangerous}"`);
          errors++;
        }
      }

      if ((trimmedKey.includes('SECRET') || trimmedKey.includes('KEY')) &&
          value.length < 16 &&
          !value.includes('REEMPLAZAR') &&
          !value.includes('YOUR_') &&
          !value.includes('TU_')) {
        console.warn(`  WARN: ${trimmedKey} seems too short (${value.length} chars)`);
        warnings++;
      }
    }

    for (const required of REQUIRED_VARS) {
      const found = lines.find(l => l.startsWith(required + '='));
      if (!found) {
        console.warn(`  WARN: ${required} not found`);
      } else {
        const val = found.split('=').slice(1).join('=').trim();
        if (val.startsWith('TU_') || val.startsWith('YOUR_') || val.includes('REEMPLAZAR')) {
          console.error(`  ERROR: ${required} has placeholder value`);
          errors++;
        }
      }
    }

    console.log(`  Result: ${errors} errors, ${warnings} warnings`);
    return errors === 0;
  } catch (err) {
    console.error(`  ERROR: Could not read file: ${err}`);
    return false;
  }
}

const envLocalPath = './.env.local';
const isValid = validateEnvFile(envLocalPath);

if (!isValid) {
  console.error('\n✗ Validation FAILED. Fix the errors above.');
  process.exit(1);
} else {
  console.log('\n✓ Validation PASSED.');
}
