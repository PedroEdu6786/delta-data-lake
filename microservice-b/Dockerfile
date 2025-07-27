FROM node:22.16.0

WORKDIR /app

# Copy workspace root and install deps using yarn workspaces
COPY package.json yarn.lock ./
COPY microservice-b ./microservice-b
COPY libs ./libs

RUN yarn install --frozen-lockfile

WORKDIR /app/microservice-b
RUN yarn build

CMD ["node", "dist/main.js"]
