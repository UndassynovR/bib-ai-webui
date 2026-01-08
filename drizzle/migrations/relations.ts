import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	conversations: {
		user: r.one.users({
			from: r.conversations.userId,
			to: r.users.id
		}),
		messages: r.many.messages(),
	},
	users: {
		conversations: r.many.conversations(),
	},
	messages: {
		conversation: r.one.conversations({
			from: r.messages.conversationId,
			to: r.conversations.id
		}),
	},
}))