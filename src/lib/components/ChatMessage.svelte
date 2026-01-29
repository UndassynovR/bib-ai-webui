<script lang="ts">
  import { marked } from 'marked';
  import BookCards from './BookCards.svelte';

  interface Props {
    content: string;
    isUser: boolean;
    isStreaming?: boolean;
  }

  let { content, isUser, isStreaming = false }: Props = $props();

  // Parse multiple JSON arrays from the content
  let parsed = $derived.by(() => {
    let books: any[] = [];
    let messageText = content;

    if (!isUser) {
      try {
        // Find and extract all JSON arrays
        let currentPos = 0;
        let allBooks: any[] = [];
        const jsonArrays: Array<{start: number, end: number}> = [];
        
        while (currentPos < content.length) {
          const startIdx = content.indexOf('[', currentPos);
          if (startIdx === -1) break;
          
          // Find matching closing bracket
          let depth = 0;
          let endIdx = -1;
          
          for (let i = startIdx; i < content.length; i++) {
            if (content[i] === '[') depth++;
            if (content[i] === ']') {
              depth--;
              if (depth === 0) {
                endIdx = i;
                break;
              }
            }
          }
          
          if (endIdx === -1) break;
          
          const potentialJson = content.slice(startIdx, endIdx + 1);
          
          try {
            const parsedData = JSON.parse(potentialJson);
            if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].DOC_ID) {
              allBooks.push(...parsedData);
              jsonArrays.push({ start: startIdx, end: endIdx + 1 });
            }
          } catch {
            // Not valid JSON, continue searching
          }
          
          currentPos = endIdx + 1;
        }
        
        if (allBooks.length > 0) {
          books = allBooks;
          
          // Remove all JSON arrays from message text (in reverse order to maintain indices)
          messageText = content;
          for (let i = jsonArrays.length - 1; i >= 0; i--) {
            messageText = messageText.slice(0, jsonArrays[i].start) + messageText.slice(jsonArrays[i].end);
          }
          messageText = messageText.trim();
        }
      } catch (e) {
        console.error('Error parsing book data:', e);
      }
    }

    return { books, messageText };
  });

  marked.setOptions({ breaks: true, gfm: true });

  let renderedContent = $derived(
    isUser ? parsed.messageText : marked(parsed.messageText.replace(/^(?:\[\])+/,''))
  );
</script>

<div class="message" class:user={isUser} class:assistant={!isUser}>
  {#if isUser}
    <div class="bubble user-bubble">
      {parsed.messageText}
    </div>
  {:else}
    <div class="bubble assistant-bubble">
      {#if parsed.books.length}
        <BookCards books={parsed.books} />
      {/if}
      {@html renderedContent}
      {#if isStreaming}
        <span class="cursor">▊</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .message {
    display: flex;
    padding: 0.5rem 0;
    animation: fadeIn 0.3s ease-in;
  }
  .message.user {
    justify-content: flex-end;
  }
  .message.assistant {
    justify-content: flex-start;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .bubble {
    max-width: 80%;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    word-wrap: break-word;
  }

  .user-bubble {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-bottom-right-radius: 0.25rem;
  }

  .assistant-bubble {
    background: transparent;
    color: var(--text-primary);
  }

  .assistant-bubble :global(p) {
    margin: 0 0 0.75rem;
  }
  .assistant-bubble :global(p:last-child) {
    margin-bottom: 0;
  }

  .assistant-bubble :global(code) {
    background: var(--bg-secondary);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    color: var(--text-primary);
  }

  .assistant-bubble :global(pre) {
    background: var(--bg-secondary);
    padding: 0.75rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 0.75rem 0;
    color: var(--text-primary);
  }

  .assistant-bubble :global(pre code) {
    background: transparent;
    padding: 0;
    color: var(--text-primary);
  }

  .assistant-bubble :global(ul),
  .assistant-bubble :global(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .assistant-bubble :global(li) {
    margin: 0.25rem 0;
  }

  .assistant-bubble :global(blockquote) {
    border-left: 3px solid var(--border-color);
    padding-left: 1rem;
    margin: 0.75rem 0;
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

  @media (max-width: 700px) {
    .bubble {
      max-width: 90%;
      font-size: 1rem;
    }
  }
</style>
