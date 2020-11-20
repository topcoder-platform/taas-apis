
FROM node:14.15.0

# Set working directory. Paths will be relative this WORKDIR.
WORKDIR /usr/src/app

ENV NODE_CONFIG_DIR /usr/src/app/config/

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files from host computer to the container
COPY . .

# Run the app
CMD [ "npm", "start" ]
