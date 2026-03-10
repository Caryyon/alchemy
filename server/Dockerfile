FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./
EXPOSE 3456
ENV PORT=3456
CMD ["node", "index.js"]
