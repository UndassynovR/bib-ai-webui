import { pgSchema, pgTable, uuid, serial, varchar, text, bigint, boolean, timestamp, index, foreignKey, primaryKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const drizzle = pgSchema("drizzle");


export const drizzleMigrationsInDrizzle = drizzle.table("__drizzle_migrations", {
	id: serial().primaryKey(),
	hash: text().notNull(),
	createdAt: bigint("created_at", { mode: 'number' }),
});

export const conversations = pgTable("conversations", {
	id: uuid().primaryKey(),
	userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	title: varchar({ length: 256 }).notNull(),
	model: varchar({ length: 100 }).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	index("conversations_user_id_idx").using("btree", table.userId.asc().nullsLast()),
]);

export const messages = pgTable("messages", {
	id: uuid().primaryKey(),
	conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" } ),
	isUser: boolean("is_user").notNull(),
	content: text().notNull(),
}, (table) => [
	index("messages_conversation_id_idx").using("btree", table.conversationId.asc().nullsLast()),
]);

export const users = pgTable("users", {
	id: uuid().primaryKey(),
	email: varchar({ length: 256 }),
	name: varchar({ length: 256 }),
	isGuest: boolean("is_guest").default(true).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => [
	index("users_updated_at_idx").using("btree", table.updatedAt.asc().nullsLast()),
	unique("users_email_unique").on(table.email),]);
