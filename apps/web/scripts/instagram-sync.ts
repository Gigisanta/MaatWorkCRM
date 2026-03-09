import { db } from "../server/db";
import { instagramAccounts } from "../server/db/schema";
import { syncInstagramConversations } from "../server/instagram/client";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔄 Instagram CRM Sync Started\n");
  
  const accounts = await db
    .select()
    .from(instagramAccounts)
    .where(eq(instagramAccounts.isActive, true));
  
  if (accounts.length === 0) {
    console.log("❌ No active Instagram accounts found");
    process.exit(0);
  }
  
  console.log(`📱 Found ${accounts.length} active account(s)\n`);
  
  for (const account of accounts) {
    console.log(`🔄 Syncing: ${account.pageName} (${account.instagramUserId})`);
    
    try {
      const result = await syncInstagramConversations(account.id);
      
      console.log(`   ✅ Synced ${result.synced} conversations`);
      
      if (result.errors.length > 0) {
        console.log(`   ⚠️  ${result.errors.length} errors:`);
        result.errors.slice(0, 3).forEach((err) => {
          console.log(`      - ${err}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log("");
  }
  
  console.log("✨ Sync complete");
}

main().catch(console.error);
