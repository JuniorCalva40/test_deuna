ARG NODE_VERSION=20

# ---- Base ----
FROM node:$NODE_VERSION-alpine AS base

WORKDIR /app

# ---- Build ----
FROM base AS build

ENV NPM_VERSION=10.8.2

COPY package*.json .npmrc ./

RUN npm i -g npm@${NPM_VERSION} && \
    npm ci --quiet

COPY . .

RUN npm run build --quiet

# ---- Release ----
FROM base AS release

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 80

CMD ["node", "dist/main.js"]
