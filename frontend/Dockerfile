FROM node:24-bookworm-slim AS development

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

FROM development AS production
ENV NODE_ENV=production
RUN pnpm build
CMD ["pnpm", "start", "--hostname", "0.0.0.0"]
