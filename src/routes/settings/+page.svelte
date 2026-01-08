<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // redirect to general by default
  onMount(() => goto('/settings/general'));
</script>

