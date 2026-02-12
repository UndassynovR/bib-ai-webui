import {
  pgTable,
  varchar,
  index,
  uuid,
  boolean,
  timestamp,
  uniqueIndex,
  integer,
  text,
} from "drizzle-orm/pg-core";

// Users table (LDAP + local + guest support)
export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    email: varchar({ length: 256 }),
    name: varchar({ length: 256 }),
    password_hash: varchar({ length: 256 }), // For local users only
    auth_type: varchar({ length: 10 }).notNull().default("local"), // 'local' or 'ldap'
    ldap_guid: varchar({ length: 64 }),
    is_guest: boolean().notNull().default(true),
    role: varchar({ length: 20 }).notNull().default("user"),
    theme: varchar({ length: 20 }).notNull().default("system"),
    language: varchar({ length: 10 }).notNull().default("auto"),
    created_at: timestamp().defaultNow(),
    updated_at: timestamp().defaultNow(),
  },
  (table) => ({
    email_idx: index("users_email_idx").on(table.email),
    ldap_guid_idx: index("users_ldap_guid_idx").on(table.ldap_guid),
    auth_type_idx: index("users_auth_type_idx").on(table.auth_type),
    updated_at_idx: index("users_updated_at_idx").on(table.updated_at),
  })
);

// Sessions table
export const sessions = pgTable(
  "sessions",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    user_id: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar({ length: 256 }).unique().notNull(),
    expires_at: timestamp().notNull(),
  },
  (table) => ({
    token_idx: index("sessions_token_idx").on(table.token),
    user_id_idx: index("sessions_user_id_idx").on(table.user_id),
  })
);

// Conversations
export const conversations = pgTable(
  "conversations",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    user_id: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar({ length: 256 }).notNull(),
    model: varchar({ length: 100 }).notNull(),
    updated_at: timestamp().defaultNow(),
  },
  (table) => ({
    user_id_idx: index("conversations_user_id_idx").on(table.user_id),
  })
);

// Messages
export const messages = pgTable(
  "messages",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    conversation_id: uuid().notNull().references(() => conversations.id, { onDelete: "cascade" }),
    is_user: boolean().notNull(),
    content: text().notNull(),
  },
  (table) => ({
    conversation_id_idx: index("messages_conversation_id_idx").on(table.conversation_id),
  })
);

// Bookmarks
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    user_id: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    doc_id: integer().notNull(),
  },
  (table) => ({
    user_id_idx: index("bookmarks_user_id_idx").on(table.user_id),
    doc_id_idx: index("bookmarks_doc_id_idx").on(table.doc_id),
    user_doc_unique: uniqueIndex("bookmarks_user_doc_unique").on(table.user_id, table.doc_id),
  })
);

// Book descriptions
export const bookDescriptions = pgTable(
  "book_descriptions",
  {
    doc_id: integer().primaryKey(),
    description: text(),
  },
  (table) => ({
    doc_id_idx: index("book_descriptions_doc_id_idx").on(table.doc_id),
  })
);
