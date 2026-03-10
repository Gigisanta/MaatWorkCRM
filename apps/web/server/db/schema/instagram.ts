// ============================================================
// MaatWork CRM — Drizzle Schema: Instagram CRM Module
// ============================================================
// Tables: instagramAccounts, instagramConversations, instagramMessages
// Integrates with Instagram Graph API for messaging automation
// Database: PostgreSQL (Neon)
// ============================================================

import { boolean, integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { organizations, users } from "./auth";
import { contacts } from "./crm";

// ── Instagram Connected Accounts ───────────────────────────────
// Stores Instagram Business accounts linked to users
export const instagramAccounts = pgTable("instagram_accounts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Instagram Page/Account info
  pageId: text("page_id").notNull(),
  pageName: text("page_name").notNull(),
  instagramUserId: text("instagram_user_id").notNull(),

  // OAuth tokens (stored encrypted in production)
  accessToken: text("access_token").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshToken: text("refresh_token"),

  // Status
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Instagram Conversations ───────────────────────────────────
// Threads/conversations from Instagram DM
export const instagramConversations = pgTable("instagram_conversations", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: "cascade" }),

  // Instagram conversation ID
  igConversationId: text("ig_conversation_id").notNull().unique(),

  // Linked contact (if exists in CRM)
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),

  // Participant info
  participantIgId: text("participant_ig_id").notNull(),
  participantUsername: text("participant_username").notNull(),
  participantProfileUrl: text("participant_profile_url"),
  participantName: text("participant_name"),

  // Conversation metadata
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"),
  unreadCount: integer("unread_count").default(0),

  // CRM tracking fields
  respondedToAd: boolean("responded_to_ad").default(false),
  respondedToStory: boolean("responded_to_story").default(false),
  iSentMessage: boolean("i_sent_message").default(false),
  lastUserMessageAt: timestamp("last_user_message_at"),
  lastUserMessageContent: text("last_user_message_content"),
  lastIgMessageAt: timestamp("last_ig_message_at"),
  lastIgMessageContent: text("last_ig_message_content"),
  daysSinceLastContact: integer("days_since_last_contact"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Instagram Messages ────────────────────────────────────────
// Individual messages from conversations
export const instagramMessages = pgTable("instagram_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => instagramConversations.id, { onDelete: "cascade" }),

  // Instagram message ID
  igMessageId: text("ig_message_id").notNull().unique(),

  // Message content
  content: text("content"),
  messageType: text("message_type"), // text, image, video, story_share, etc.

  // Sender info
  fromIgUserId: text("from_ig_user_id").notNull(),
  fromMe: boolean("from_me").notNull().default(false),

  // Attachments (JSON)
  attachments: text("attachments"), // JSON array of attachment objects

  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Instagram Message Tags ────────────────────────────────────
// Auto-generated tags based on message behavior
export const instagramMessageTags = pgTable("instagram_message_tags", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => instagramConversations.id, { onDelete: "cascade" }),

  tag: text("tag").notNull(), // e.g., "responded_to_ad", "hot_lead", "no_response"
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// ── Type Exports ───────────────────────────────────────────────
export type InstagramAccount = typeof instagramAccounts.$inferSelect;
export type NewInstagramAccount = typeof instagramAccounts.$inferInsert;
export type InstagramConversation = typeof instagramConversations.$inferSelect;
export type NewInstagramConversation = typeof instagramConversations.$inferInsert;
export type InstagramMessage = typeof instagramMessages.$inferSelect;
export type NewInstagramMessage = typeof instagramMessages.$inferInsert;
export type InstagramMessageTag = typeof instagramMessageTags.$inferSelect;
export type NewInstagramMessageTag = typeof instagramMessageTags.$inferInsert;
