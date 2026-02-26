<script lang="ts">
	import { page } from "$app/stores";
	import { i18n } from "$lib/stores/i18nStore.svelte";
	import { chatStore } from "$lib/stores/chatStore.svelte";
	import Chat from "$lib/components/Chat.svelte";

	// React to URL changes
	$effect(() => {
		const conversationId = $page.params.id;
		if (conversationId) {
			chatStore.loadConversation(conversationId);
		}
	});
</script>

<svelte:head>
	<title>{i18n.t("chat.newChat")}</title>
</svelte:head>

<Chat />
