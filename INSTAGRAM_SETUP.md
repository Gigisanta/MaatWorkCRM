# Instagram CRM Setup Guide

This guide covers setting up Instagram Business messaging integration for MaatWorkCRM using the Instagram Graph API.

## Prerequisites

1. **Facebook Developer Account** - Create at developers.facebook.com
2. **Meta Business Account** - Required for Instagram Business features
3. **Instagram Business Account** - Must be linked to a Facebook Page

## Step 1: Create Facebook App

1. Go to developers.facebook.com → My Apps → Create App
2. Select "Other" → "Business" → App Name
3. Add "Instagram" product:
   - Go to App Dashboard → Add Products
   - Find "Instagram" → Configure
   - Add "Instagram Basic Display" and/or "Instagram Graph API"

## Step 2: Configure App Settings

### Basic Settings
- Set App Mode to "Live" (required for real messages)
- Add Privacy Policy URL
- Add your domain to "Allowed Domains"

### Required Permissions
Request these permissions via App Review:
- `instagram_business_basic` - Read Instagram profiles
- `instagram_business_manage_messages` - Read/Send messages
- `instagram_business_content_read` - Read media (optional)
- `pages_show_list` - List associated pages
- `pages_read_engagement` - Read page engagement

## Step 3: Environment Variables

Add to `.env`:

```env
# Instagram Graph API
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/instagram/callback
INSTAGRAM_graph_API_VERSION=v21.0
```

## Step 4: Database Migration

Run the migration to create Instagram tables:

```bash
cd apps/web
npm run db:migrate
# or
pnpm db:migrate
```

This creates:
- `instagram_accounts` - Connected IG accounts
- `instagram_conversations` - DM threads
- `instagram_messages` - Individual messages
- `instagram_message_tags` - Auto-tags

## Step 5: OAuth Flow

### Connect Account Flow
1. User clicks "Connect Instagram" in CRM UI
2. Server generates auth URL with permissions
3. User authorizes on Instagram/Facebook
4. Callback receives code → exchanges for token
5. Token stored in `instagram_accounts` table

### Token Management
- Tokens are short-lived (1-2 hours initially)
- Exchange for long-lived tokens (60 days)
- Use `refreshInstagramToken()` before expiry

## Step 6: Sync Conversations

Run initial sync:

```bash
npm run instagram:sync
# or
pnpm instagram:sync
```

For continuous sync, add to your cron:

```bash
# Every 15 minutes
*/15 * * * * cd /path/to/app && pnpm instagram:sync
```

## API Reference

### Server Functions

```typescript
// Get all connected accounts
const accounts = await getInstagramAccounts(orgId);

// Connect new account (returns auth URL)
const { authUrl } = await connectInstagramAccount(orgId, userId);

// Sync conversations for account
await syncInstagramAccount(accountId);

// Get conversations
const convos = await getInstagramConversations(accountId);

// Get messages in conversation
const messages = await getInstagramMessages(conversationId);
```

### OAuth Handlers

```typescript
// Generate authorization URL
const url = getInstagramAuthUrl(appId, redirectUri);

// Complete OAuth flow
const account = await completeInstagramOAuth(code, orgId, userId);

// Refresh token before expiry
await refreshInstagramToken(accountId);
```

## Webhook Setup (Optional)

For real-time message delivery:

1. Go to App Dashboard → Instagram → Webhooks
2. Subscribe to `messages` field
3. Implement webhook handler in `/api/instagram/webhook`

## Rate Limits

- **API Calls**: 200 calls/hour per page
- **Messages**: 250 messages/hour per page
- **Token Refresh**: 1 refresh per token/day

## Troubleshooting

### "Page not found" error
- Ensure Instagram Business account is linked to Facebook Page

### "OAuth error" during token exchange
- Verify App ID/Secret are correct
- Check redirect URI matches exactly
- Ensure permissions are approved

### "Permission denied" errors
- Submit App for Review with use case
- Test with admin accounts first

### Sync not getting messages
- Check `instagram_business_manage_messages` permission
- Verify token is valid (not expired)

## Security Notes

- Store tokens encrypted in production
- Implement token refresh automation
- Log all API calls for debugging
- Use HTTPS for all endpoints

## Files Structure

```
apps/web/
├── server/
│   ├── db/schema/
│   │   └── instagram.ts          # Database schema
│   ├── instagram/
│   │   ├── client.ts             # API client
│   │   ├── oauth.ts              # OAuth handlers
│   │   └── index.ts              # Exports
│   └── functions/
│       └── instagram.ts          # Server functions
├── scripts/
│   └── instagram-sync.ts         # CLI sync script
└── package.json                   # npm scripts
```

## Next Steps

1. Test OAuth flow with development app
2. Implement UI for account management
3. Add webhook handlers for real-time sync
4. Build message response UI
5. Implement auto-tagging logic
