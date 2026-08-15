# ---- build stage -------------------------------------------------------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy only what's needed to resolve dependencies first, so this layer
# is cached and re-used whenever pom.xml hasn't changed.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ---- runtime stage -----------------------------------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --create-home --shell /bin/false app
USER app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]