
FROM node:latest

# Set working directory. Paths will be relative this WORKDIR.
WORKDIR /usr/src/app

ENV NODE_CONFIG_DIR /usr/src/app/config/

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files from host computer to the container
COPY . .


# Specify port app runs on
EXPOSE 3000

# Run the app
CMD [ "node", "app.js" ]