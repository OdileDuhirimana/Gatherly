FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
