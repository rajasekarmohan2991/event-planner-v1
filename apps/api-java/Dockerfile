# Build stage
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# First download dependencies to cache them
RUN mvn dependency:go-offline
# Copy source code
COPY src ./src
# Build the application using Spring Boot Maven plugin
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copy the JAR file with the -SNAPSHOT suffix that Spring Boot Maven plugin generates
COPY --from=build /app/target/api-java-*.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Set JVM options and Spring profile
ENV JAVA_TOOL_OPTIONS="-XX:+UseZGC -XX:MaxRAMPercentage=75.0"
ENV SPRING_PROFILES_ACTIVE=prod

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]