package com.pawan.todos;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())                       // ①
                .cors(Customizer.withDefaults())                    // ②
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))   // ③
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))  // ④
                .authorizeHttpRequests(auth -> auth                 // ⑤ order matters
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/tasks/**").permitAll()   // Module 3 locks this
                        .requestMatchers("/api/ping", "/api/health").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/error").permitAll() //permit errors through
                        .anyRequest().authenticated())
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}