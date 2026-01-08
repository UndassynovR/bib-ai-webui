# AI Library Assistant

A modern web application built with SvelteKit that combines an AI chat interface with a library catalog system. Features include conversation management, book search, bookmarking, and multi-language support.

## Features

### 🤖 AI Chat
- Real-time streaming responses
- Conversation history management
- Message persistence
- Tool-enabled AI (book search integration)

### 📚 Library Integration
- Search books from MSSQL database
- View book details (title, author, publisher, year, quantity)
- Bookmark favorite books
- Browse bookmarked collection

### 👤 User Management
- Guest mode (no registration required)
- User registration and authentication
- Account upgrade (guest → registered user)
- Session-based authentication

### 🎨 UI/UX
- Responsive design (mobile & desktop)
- Collapsible sidebar navigation
- Dark/light theme support
- Multi-language support (English, Russian, Kazakh)
- Smooth page transitions with blur effects
- Custom scrollbars

## Tech Stack

### Frontend
- **SvelteKit** - Full-stack framework with SSR
- **Svelte 5** - Latest Svelte with runes
- **TypeScript** - Type safety
- **Lucide Svelte** - Icon library
- **View Transitions API** - Smooth page transitions

### Backend
- **Bun** - JavaScript runtime
- **PostgreSQL** - User data, conversations, bookmarks
- **MSSQL** - Library catalog (read-only)
- **Drizzle ORM** - Type-safe database access

### Authentication
- Session-based authentication with cookies
- Password hashing with bcrypt
- Guest user support

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── Chat.svelte              # Main chat interface
│   │   ├── ChatMessage.svelte        # Individual message component
│   │   ├── ChatInput.svelte          # Message input field
│   │   ├── Sidebar.svelte            # Navigation sidebar
│   │   ├── Nav.svelte                # Top navigation bar
│   │   ├── BookCards.svelte          # Book display grid
│   │   ├── ConversationItem.svelte   # Chat history item
│   │   └── AuthModal.svelte          # Login/register modal
│   ├── server/
│   │   ├── db/
│   │   │   ├── pg/                   # PostgreSQL schema & connection
│   │   │   └── mssql/                # MSSQL schema & connection
│   │   └── services/
│   │       ├── ai.service.ts         # AI chat service
│   │       ├── conversation.service.ts
│   │       ├── message.service.ts
│   │       └── tools/
│   │           └── searchBooks.ts    # Book search tool
│   └── stores/
│       ├── chatStore.svelte.ts       # Chat state management
│       ├── bookmarkStore.svelte.ts   # Bookmark state
│       ├── themeStore.svelte.ts      # Theme management
│       └── i18nStore.svelte.ts       # Internationalization
├── routes/
│   ├── api/
│   │   ├── auth/+server.ts           # Authentication endpoints
│   │   ├── bookmarks/+server.ts      # Bookmark CRUD
│   │   ├── c/                        # Conversation endpoints
│   │   └── settings/+server.ts       # User settings
│   ├── c/[id]/+page.svelte           # Chat page
│   ├── bookmarks/+page.svelte        # Bookmarks page
│   ├── settings/                     # Settings pages
│   └── +layout.svelte                # Root layout
└── app.css                           # Global styles & theming
```

## Database Schema

### PostgreSQL Tables

**users**
- User accounts (both guest and registered)
- Theme and language preferences
- Email and password (nullable for guests)

**sessions**
- Session tokens
- Expiration tracking

**conversations**
- Chat conversation metadata
- Associated with users

**messages**
- Individual chat messages
- Linked to conversations

**bookmarks**
- User bookmarks for library books
- References DOC_ID from MSSQL database

### MSSQL Tables (Read-Only)

**DOC_VIEW**
- Library catalog
- Book metadata (title, author, publisher, year, etc.)
- Quantity and availability

## Environment Variables

Create a `.env` file in the root directory:

```env
# PostgreSQL
PG_DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# MSSQL (Library Database)
MSSQL_DATABASE_URL=Server=localhost;Database=library;User Id=user;Password=pass;

# Optional
NODE_ENV=development
```

## Installation

```bash
# Install dependencies
bun install

# Generate database migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Start development server
bun dev
```

## Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## Features in Detail

### Bookmarking System
- Click bookmark icon on any book card
- Optimistic UI updates (instant feedback)
- Persists across sessions
- Works for both guest and registered users
- Dedicated bookmarks page with grid layout

### Chat System
- Streaming AI responses
- Book search integration via AI tools
- Conversation history in sidebar
- Delete conversations
- Auto-generated conversation titles

### Theme System
- Light and dark themes
- System preference detection
- Smooth transitions between themes
- Persisted user preference

### Internationalization
- English, Russian, Kazakh support
- Auto-detection from browser
- User preference override
- Typewriter effect on empty state

### Mobile Optimizations
- Responsive sidebar (popup on mobile)
- Touch-friendly buttons
- Optimized spacing
- Horizontal tabs in settings
- Disabled transitions on mobile (prevents sidebar flash)

## Customization

### Changing Colors
Edit `src/app.css` to modify the color scheme:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9f9f9;
  --text-primary: #1a1a1a;
  --primary-color: #4a90e2;
  /* ... */
}
```

### Adding New Languages
1. Create translation file in `src/lib/i18n/translations/`
2. Add language option in `i18nStore.svelte.ts`
3. Update language selector in settings

### Configuring AI
Edit `src/lib/server/services/ai.service.ts` to:
- Change AI model
- Modify system prompts
- Add/remove tools
- Adjust streaming behavior

## Performance

- **SSR** for fast initial page load
- **Code splitting** per route
- **Lazy loading** of conversations
- **Optimistic updates** for instant feedback
- **View Transitions API** for smooth navigation (desktop only)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Known Limitations

- View Transitions API disabled on mobile to prevent sidebar overlay issues
- MSSQL database is read-only (book data cannot be modified)
- Guest sessions expire after 30 days

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (mobile + desktop)
5. Submit a pull request

## Acknowledgments

- Built with SvelteKit and Svelte 5
- Icons by Lucide
- UI inspired by modern chat interfaces
- Powered by Bun runtime

---

**Note:** This project requires both PostgreSQL and MSSQL databases. Ensure both are running and accessible before starting the application.
