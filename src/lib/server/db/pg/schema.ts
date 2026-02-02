import {
  pgTable,
  text,
  varchar,
  index,
  uuid,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    email: varchar({ length: 256 }).unique(),
    password_hash: varchar({ length: 256 }),
    name: varchar({ length: 256 }),
    is_guest: boolean().notNull().default(true),
    role: varchar({ length: 20 }).notNull().default('user'), // 'user' | 'admin'
    theme: varchar({ length: 20 }).notNull().default('system'),
    language: varchar({ length: 10 }).notNull().default('auto'),
    updated_at: timestamp().defaultNow(),
  },
  (table) => ({
    email_idx: index("users_email_idx").on(table.email),
    updated_at_idx: index("users_updated_at_idx").on(table.updated_at),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    user_id: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: varchar({ length: 256 }).unique().notNull(),
    expires_at: timestamp().notNull(),
  },
  (table) => ({
    token_idx: index("sessions_token_idx").on(table.token),
    user_id_idx: index("sessions_user_id_idx").on(table.user_id),
  })
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    user_id: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar({ length: 256 }).notNull(),
    model: varchar({ length: 100 }).notNull(),
    updated_at: timestamp().defaultNow(),
  },
  (table) => ({
    user_id_idx: index("conversations_user_id_idx").on(table.user_id),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    conversation_id: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    is_user: boolean().notNull(),
    content: text().notNull(),
  },
  (table) => ({
    conversation_id_idx: index("messages_conversation_id_idx").on(
      table.conversation_id
    ),
  })
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid().primaryKey().$default(() => Bun.randomUUIDv7()),
    user_id: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    doc_id: integer().notNull(), // References DOC_ID from MSSQL database
    created_at: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    user_id_idx: index("bookmarks_user_id_idx").on(table.user_id),
    doc_id_idx: index("bookmarks_doc_id_idx").on(table.doc_id),
    // Ensure user can't bookmark the same book twice
    user_doc_unique: uniqueIndex("bookmarks_user_doc_unique").on(
      table.user_id,
      table.doc_id
    ),
  })
);

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
