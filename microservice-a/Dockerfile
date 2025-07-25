FROM node:22.16.0

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

# Copy workspace root and install deps using yarn workspaces
COPY package.json yarn.lock ./
COPY microservice-a ./microservice-a
COPY microservice-b ./microservice-b
COPY libs ./libs

RUN yarn install --frozen-lockfile

RUN pip3 install --break-system-packages -r microservice-a/scripts/requirements.txt

WORKDIR /app/microservice-a
RUN yarn build

CMD ["node", "dist/main.js"]
