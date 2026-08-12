package com.pawan.todos.user;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TokenServiceTest {

    private static SecretKey key(String secret) {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    private final SecretKey secretKey = key("test-secret-that-is-at-least-32-characters-long");

    private final JwtEncoder encoder =
            NimbusJwtEncoder.withSecretKey(secretKey).algorithm(MacAlgorithm.HS256).build();
    private final JwtDecoder decoder =
            NimbusJwtDecoder.withSecretKey(secretKey).macAlgorithm(MacAlgorithm.HS256).build();

    private final TokenService service = new TokenService(encoder, "todos-api", 60);

    private static User userWithId(UUID id, String email) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(id);
        when(user.getEmail()).thenReturn(email);
        return user;
    }

    @Test
    void issuesATokenCarryingTheUserIdIssuerAndExpiry() {
        UUID userId = UUID.randomUUID();

        TokenService.IssuedToken issued = service.issue(userWithId(userId, "pawan@example.com"));
        Jwt jwt = decoder.decode(issued.value());

        assertThat(jwt.getSubject()).isEqualTo(userId.toString());
        assertThat(jwt.getClaimAsString("iss")).isEqualTo("todos-api");
        assertThat(jwt.getClaimAsString("email")).isEqualTo("pawan@example.com");
        assertThat(jwt.getExpiresAt())
                .isBetween(Instant.now().plusSeconds(3500), Instant.now().plusSeconds(3700));
    }

    @Test
    void aTokenSignedWithAnotherSecretIsRejected() {
        String token = service.issue(userWithId(UUID.randomUUID(), "pawan@example.com")).value();

        JwtDecoder otherDecoder = NimbusJwtDecoder
                .withSecretKey(key("a-completely-different-secret-key-32chars"))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

        assertThatThrownBy(() -> otherDecoder.decode(token)).isInstanceOf(JwtException.class);
    }
}