FROM oven/bun:latest

WORKDIR /app

# deps first (better cache)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# app source
COPY . .

# production env
ENV NODE_ENV=production
ARG APP_PORT=5173
ENV PORT=${APP_PORT}

# build SvelteKit app
#RUN bunx svelte-kit sync && bun run build

EXPOSE ${APP_PORT}

# Simple startup: just run migrations and start
# Admin account will be created automatically on first HTTP request via hooks.server.ts
RUN echo '#!/bin/sh\n\
echo "🚀 Starting application..."\n\
echo ""\n\
echo "📊 Running database migrations..."\n\
bun run db:generate\n\
bun run db:migrate\n\
echo ""\n\
echo "🌐 Starting server..."\n\
echo "👤 Admin account will be created on first request"\n\
echo ""\n\
bun dev\n\
' > /app/startup.sh && chmod +x /app/startup.sh

CMD ["/app/startup.sh"]

# For production:
#RUN bunx svelte-kit sync && bun run build
#CMD ["sh", "-c", "bun run db:generate && bun run db:migrate && bun run start"]

