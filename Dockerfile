FROM oven/bun:latest

WORKDIR /app

COPY package.json .
COPY bun.lock .

RUN bun i

COPY . .

EXPOSE 5173

# CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
CMD ["sh", "-c", "bun run db:generate && bun run db:migrate && bun run dev --host 0.0.0.0"]
