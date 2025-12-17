FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install Java (OpenJDK 11) for Alloy
RUN apk add --no-cache openjdk11
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk
ENV PATH="$JAVA_HOME/bin:$PATH"

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
