FROM oven/bun:alpine

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
RUN bunx svelte-kit sync && bun run build

EXPOSE ${APP_PORT}

# run real prod server
CMD ["sh", "-c", "bun run db:generate && bun run db:migrate && bun run start"]