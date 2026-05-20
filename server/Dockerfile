FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-17-alpine AS server-build
WORKDIR /app/server
COPY server/pom.xml ./
RUN mvn -B dependency:go-offline
COPY server/src ./src
COPY --from=client-build /app/client/dist ./src/main/resources/static
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=server-build /app/server/target/*.jar app.jar
USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
