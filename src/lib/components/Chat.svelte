<script lang="ts">
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { goto } from '$app/navigation';
  import { i18n } from '$lib/stores/i18nStore.svelte';
  import ChatMessage from './ChatMessage.svelte';
  import ChatInput from './ChatInput.svelte';
  import { onMount } from 'svelte';

  let isStreaming = $state(false);
  let streamingContent = $state("");
  let chatContainer: HTMLDivElement;
  let messagesLoaded = $state(false);

  // Typewriter effect state
  let typedTitle = $state("");
  let typedHint = $state("");
  let showTitleCursor = $state(true);
  let showHintCursor = $state(false);

  let messagesList = $derived(chatStore.messages ?? []);
  let hasMessages = $derived(messagesList.length > 0);

  $effect(() => {
    if (hasMessages && chatContainer) {
      scrollToBottom();
    }
  });

  // Watch for when messages finish loading
  $effect(() => {
    if (!chatStore.isLoadingMessages && hasMessages) {
      // Small delay to allow DOM to update before fading in
      setTimeout(() => {
        messagesLoaded = true;
      }, 50);
    } else {
      messagesLoaded = false;
    }
  });

  // Typewriter effect for empty state
  onMount(() => {
    typeWriterEffect();
  });

  async function typeWriterEffect() {
    const title = i18n.t('chat.emptyTitle');
    const hint = i18n.t('chat.emptyHint');
    const speed = 50; // milliseconds per character

    // Type title
    for (let i = 0; i < title.length; i++) {
      typedTitle += title.charAt(i);
      await new Promise(resolve => setTimeout(resolve, speed));
    }

    showTitleCursor = false;
    showHintCursor = true;

    // Small pause between title and hint
    await new Promise(resolve => setTimeout(resolve, 300));

    // Type hint
    for (let i = 0; i < hint.length; i++) {
      typedHint += hint.charAt(i);
      await new Promise(resolve => setTimeout(resolve, speed));
    }

    // Keep cursor blinking after completion
    showHintCursor = true;
  }

  async function sendMessage(content: string) {
    if (!chatStore.activeConversationId) {
      const newConvId = await chatStore.createConversation(
        i18n.t('chat.newChat')
      );
      if (!newConvId) return;
      await goto(`/c/${newConvId}`);
    }

    const currentConvId = chatStore.activeConversationId;

    chatStore.addMessage({
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    });

    scrollToBottom();
    isStreaming = true;
    streamingContent = "";

    try {
      const response = await fetch(`/api/c/${currentConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error();

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            chatStore.addMessage({
              id: crypto.randomUUID(),
              content: streamingContent,
              role: 'assistant',
              timestamp: new Date().toISOString()
            });
            isStreaming = false;
            streamingContent = "";
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.title) {
              chatStore.updateConversationTitle(currentConvId, parsed.title);
            }
            if (parsed.delta) {
              streamingContent += parsed.delta;
              scrollToBottom();
            }
          } catch {}
        }
      }
    } catch {
      isStreaming = false;
      streamingContent = "";
      chatStore.addMessage({
        id: crypto.randomUUID(),
        content: i18n.t('chat.error'),
        role: 'assistant',
        timestamp: new Date().toISOString()
      });
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  }
</script>

<div class="chat-wrapper">
  <div class="messages" bind:this={chatContainer}>
    {#if chatStore.isLoadingMessages}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{i18n.t('chat.loading')}</p>
      </div>
    {:else if !hasMessages && !isStreaming}
      <div class="empty-state">
        <h2>
          {typedTitle}
          {#if showTitleCursor}
            <span class="cursor">▊</span>
          {/if}
        </h2>
        <p>
          {typedHint}
          {#if showHintCursor}
            <span class="cursor">▊</span>
          {/if}
        </p>
      </div>
    {:else}
      <div class="messages-list" class:loaded={messagesLoaded}>
        {#each messagesList as message (message.id)}
          <ChatMessage
            content={message.content}
            isUser={message.role === 'user'}
          />
        {/each}

        {#if isStreaming && streamingContent}
          <ChatMessage
            content={streamingContent}
            isUser={false}
            isStreaming={true}
          />
        {/if}
      </div>
    {/if}
  </div>

  <div class="input-wrapper">
    <ChatInput
      onSubmit={sendMessage}
      disabled={isStreaming || chatStore.isLoadingMessages}
    />
  </div>
</div>

<style>
  .chat-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: var(--text-primary);
  }

  .messages::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }

  .messages {
    scrollbar-width: none;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.4s ease-out;
  }

  .messages-list.loaded {
    opacity: 1;
  }

  .loading-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-secondary);
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--border-color);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-state p {
    font-size: 0.875rem;
    margin: 0;
    color: var(--text-secondary);
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .empty-state h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: var(--text-primary);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--text-secondary);
  }

  .cursor {
    display: inline-block;
    animation: blink 1s infinite;
    margin-left: 2px;
  }

  @keyframes blink {
    0%, 49% {
      opacity: 1;
    }
    50%, 100% {
      opacity: 0;
    }
  }

  .input-wrapper {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    background: var(--bg-primary);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  @media (max-width: 700px) {
    .messages {
      padding: 0.75rem;
    }

    .input-wrapper {
      padding: 0.75rem;
    }

    .empty-state h2 {
      font-size: 1.25rem;
    }

    .empty-state p {
      font-size: 0.875rem;
    }
  }
</style>
