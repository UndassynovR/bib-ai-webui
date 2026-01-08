import { browser } from '$app/environment';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

class ChatStore {
  conversations = $state<Conversation[]>([]);
  activeConversationId = $state<string | null>(null);
  messages = $state<Message[]>([]);
  isLoadingConversations = $state(false);
  isLoadingMessages = $state(false);

  async loadConversations() {
    if (!browser) return;
    
    this.isLoadingConversations = true;
    try {
      const response = await fetch('/api/c');
      if (response.ok) {
        this.conversations = await response.json();
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      this.isLoadingConversations = false;
    }
  }

  async loadConversation(conversationId: string) {
    if (!browser) return;
    
    // Don't reload if already loaded
    if (this.activeConversationId === conversationId) return;
    
    this.isLoadingMessages = true;
    try {
      const response = await fetch(`/api/c/${conversationId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform messages - API uses 'is_user' instead of 'role'
        if (data.messages && Array.isArray(data.messages)) {
          this.messages = data.messages.map((msg: any) => ({
            id: msg.id || crypto.randomUUID(),
            content: msg.content,
            role: msg.is_user ? 'user' : 'assistant',
            timestamp: msg.timestamp || msg.created_at || new Date().toISOString()
          }));
        } else {
          this.messages = [];
        }
        
        this.activeConversationId = conversationId;
      } else {
        console.error('Failed to load messages');
        this.messages = [];
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      this.messages = [];
    } finally {
      this.isLoadingMessages = false;
    }
  }

  // Keep for backward compatibility if needed elsewhere
  async loadMessages(conversationId: string) {
    return this.loadConversation(conversationId);
  }

  // Keep for backward compatibility
  async selectConversation(id: string) {
    return this.loadConversation(id);
  }

  async createConversation(title: string = 'New chat') {
    try {
      const response = await fetch('/api/c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, model: 'gpt-4o' })
      });

      if (response.ok) {
        const newConv = await response.json();
        this.conversations = [newConv, ...this.conversations];
        this.activeConversationId = newConv.id;
        this.messages = [];
        return newConv.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    
    return null;
  }

  async deleteConversation(id: string) {
    try {
      const response = await fetch(`/api/c/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        // Clear active conversation if it's the one being deleted
        if (this.activeConversationId === id) {
          this.activeConversationId = null;
          this.messages = [];
        }
        
        // Remove from list
        const index = this.conversations.findIndex(c => c.id === id);
        if (index !== -1) {
          this.conversations.splice(index, 1);
        }
      } else {
        console.error('Failed to delete conversation:', response.status);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  // Clear active conversation (for root route)
  clearActive() {
    this.activeConversationId = null;
    this.messages = [];
  }

  // Keep for backward compatibility
  startNewChat() {
    this.clearActive();
  }

  addMessage(message: Message) {
    this.messages = [...this.messages, message];
  }

  updateMessages(messages: Message[]) {
    this.messages = messages;
  }
  
  // Update a specific conversation's title in the list
  updateConversationTitle(conversationId: string, newTitle: string) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.title = newTitle;
    }
  }
}

export const chatStore = new ChatStore();
