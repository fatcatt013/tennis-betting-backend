FROM node:18-alpine

# Install necessary packages for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn



# Set up Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./

RUN npm install -g nodemon
RUN npm install

COPY . .

EXPOSE 3000
CMD ["nodemon", "app/server.js"]