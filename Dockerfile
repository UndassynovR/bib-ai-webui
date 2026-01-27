FROM oven/bun:latest

WORKDIR /app

COPY package.json .
COPY bun.lock .

RUN bun i

COPY . .

ARG APP_PORT=5173
ENV APP_PORT=${APP_PORT}
EXPOSE ${APP_PORT}

# CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
CMD ["sh", "-c", "bun run db:generate && bun run db:migrate && bun run dev --host 0.0.0.0"]
