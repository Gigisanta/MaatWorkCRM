#!/bin/bash
set -e
echo "=== MaatWork CRM - Secret Generator ==="
echo ""
echo "# NEXTAUTH_SECRET (base64 32):"
openssl rand -base64 32
echo ""
echo "# JWT_SECRET (base64 32):"
openssl rand -base64 32
echo ""
echo "# TOKEN_ENCRYPTION_KEY (hex 64):"
openssl rand -hex 32
echo ""
echo "# CRON_SECRET (base64 32):"
openssl rand -base64 32
echo ""
echo "# CALENDAR_WEBHOOK_VERIFY_TOKEN (hex 64):"
openssl rand -hex 32
