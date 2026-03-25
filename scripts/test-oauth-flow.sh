#!/bin/bash
set -e

echo "=== MaatWork CRM - OAuth Flow Tests ==="
echo ""

BASE_URL="${1:-http://localhost:3000}"
echo "Testing against: $BASE_URL"
echo ""

# Test 1: Login page loads
echo "[1/6] Verificando que /login carga..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✓ OK: /login retorna 200"
else
  echo "  ✗ FAIL: /login retorna $HTTP_CODE (esperado 200)"
fi

# Test 2: Session endpoint responds
echo "[2/6] Verificando /api/auth/session..."
SESSION_RESPONSE=$(curl -s "$BASE_URL/api/auth/session")
if echo "$SESSION_RESPONSE" | grep -q '"authenticated"'; then
  echo "  ✓ OK: /api/auth/session responde correctamente"
else
  echo "  ✗ FAIL: /api/auth/session no responde correctamente"
  echo "  Response: $SESSION_RESPONSE"
fi

# Test 3: NextAuth providers endpoint
echo "[3/6] Verificando /api/auth/providers (NextAuth)..."
NAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/providers")
if [ "$NAUTH_CODE" = "200" ]; then
  echo "  ✓ OK: NextAuth providers endpoint responde"
else
  echo "  ✗ WARN: NextAuth retorna $NAUTH_CODE"
fi

# Test 4: CSP headers include Google OAuth
echo "[4/6] Verificando CSP headers..."
CSP_HEADER=$(curl -sI "$BASE_URL/" 2>/dev/null | grep -i "content-security-policy" | head -1)
if echo "$CSP_HEADER" | grep -q "accounts.google.com"; then
  echo "  ✓ OK: CSP incluye Google OAuth domains"
else
  echo "  ✗ WARN: CSP no incluye Google domains (puede ser normal en dev)"
fi

# Test 5: Database integrity
echo "[5/6] Verificando base de datos..."
if [ -f "/Users/prueba/Desktop/maatworkcrmv3/db/custom.db" ]; then
  USER_COUNT=$(sqlite3 /Users/prueba/Desktop/maatworkcrmv3/db/custom.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
  GOOGLE_ACCOUNTS=$(sqlite3 /Users/prueba/Desktop/maatworkcrmv3/db/custom.db "SELECT COUNT(*) FROM Account WHERE provider='google';" 2>/dev/null || echo "0")
  echo "  Users en DB: $USER_COUNT"
  echo "  Cuentas Google: $GOOGLE_ACCOUNTS"
else
  echo "  ✗ WARN: DB no encontrada"
fi

# Test 6: Required env vars in .env.local
echo "[6/6] Verificando .env.local..."
ENV_FILE="/Users/prueba/Desktop/maatworkcrmv3/.env.local"
if [ -f "$ENV_FILE" ]; then
  # Check for placeholder values
  if grep -q "maatwork-crm-secret-key-for-development-only" "$ENV_FILE"; then
    echo "  ✗ FAIL: .env.local tiene secretos debiles (no rotados)"
  else
    echo "  ✓ OK: .env.local parece estar configurado correctamente"
  fi
else
  echo "  ✗ FAIL: .env.local no existe"
fi

echo ""
echo "=== Tests completados ==="
