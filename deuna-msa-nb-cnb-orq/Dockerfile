ARG NODE_VERSION=20

# ---- Base ----
FROM node:$NODE_VERSION-alpine AS base

WORKDIR /app

# ---- Build ----
FROM base AS build

ENV NPM_VERSION=11.3.0

COPY package*.json .npmrc ./

RUN npm i -g npm@${NPM_VERSION} && \
    npm ci --quiet

COPY . .

RUN npm run build --quiet

# ---- Release ----
FROM base AS release

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 80

CMD ["node", "dist/main.js"]
