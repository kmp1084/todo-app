package com.pawan.todos;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration                                          // ① a source of bean/config definitions
public class WebConfig implements WebMvcConfigurer {    // ② hook into Spring MVC's setup

    private final String[] allowedOrigins;

    public WebConfig(@Value("${app.cors.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;           // ③ Spring splits on commas
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")                  // ④ only the API, not /h2-console
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Location")             // ⑤ see below - this one is easy to miss
                .maxAge(3600);                          // ⑥ cache the preflight for an hour
    }
}