FROM node:18-alpine
WORKDIR /source
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
