FROM node

WORKDIR /app/courses-service

COPY package.json .

RUN npm run dev

COPY . .

EXPOSE 8001

CMD ["npm", "dev"]