<script lang="ts">
  import Chat from '$lib/components/Chat.svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    // Clear active conversation when on root
    chatStore.clearActive();
  });
</script>

<Chat />
