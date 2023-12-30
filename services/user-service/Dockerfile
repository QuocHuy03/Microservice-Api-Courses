FROM node

WORKDIR /app/user-service

COPY package.json .

RUN npm run dev

COPY . .

EXPOSE 8002

CMD ["npm", "dev"]