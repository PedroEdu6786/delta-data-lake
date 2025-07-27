FROM node:22.16.0

# Install Python & pip
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the root files needed for installing dependencies
COPY package.json yarn.lock ./

# Copy all workspace projects (to satisfy Yarn workspaces)
COPY microservice-a/ microservice-a/
COPY libs/ libs/

# Install JS dependencies using Yarn workspaces
RUN yarn install --frozen-lockfile

# Install Python requirements
COPY microservice-a/scripts/requirements.txt ./microservice-a/scripts/
RUN pip3 install --break-system-packages -r microservice-a/scripts/requirements.txt

# Build microservice-a
WORKDIR /app/microservice-a
RUN yarn build

# Run service
CMD ["node", "dist/main.js"]
