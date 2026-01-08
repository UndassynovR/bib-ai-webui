<script lang="ts">
  import { page } from '$app/stores';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import { onMount } from 'svelte';

  // React to URL changes
  $effect(() => {
    const conversationId = $page.params.id;
    if (conversationId) {
      chatStore.loadConversation(conversationId);
    }
  });
</script>

<Chat />
