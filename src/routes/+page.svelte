<script lang="ts">
	import Chat from "$lib/components/Chat.svelte";
	import { i18n } from "$lib/stores/i18nStore.svelte";
	import { chatStore } from "$lib/stores/chatStore.svelte";
	import { onMount } from "svelte";

	onMount(() => {
		// Clear active conversation when on root
		chatStore.clearActive();
	});
</script>

<svelte:head>
	<title>{i18n.t("chat.newChat")}</title>
</svelte:head>

<Chat />
