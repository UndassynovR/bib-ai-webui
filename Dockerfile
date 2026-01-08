FROM oven/bun:canary-alpine

WORKDIR /app

# Copy package files first for caching
COPY package.json .
COPY bun.lock .

# Install dependencies
RUN bun i

# Copy the rest of the project
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Run migrations and start dev server
CMD ["sh", "-c", "bun run db:generate && bun run db:migrate && bun run dev --host 0.0.0.0"]
