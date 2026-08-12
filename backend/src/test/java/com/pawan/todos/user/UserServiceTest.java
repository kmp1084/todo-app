package com.pawan.todos.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @Mock
    private TokenService tokenService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(repository, passwordEncoder, tokenService);
    }

    @Test
    void registerNormalisesTheEmailAndHashesThePassword() {
        when(repository.existsByEmail("pawan@example.com")).thenReturn(false);
        when(repository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        service.register(new RegisterRequest("  Pawan@Example.COM  ", "correcthorse"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(repository).save(saved.capture());
        User stored = saved.getValue();

        assertThat(stored.getEmail()).isEqualTo("pawan@example.com");
        assertThat(stored.getPasswordHash()).isNotEqualTo("correcthorse");
        assertThat(stored.getPasswordHash()).startsWith("$2");
        assertThat(passwordEncoder.matches("correcthorse", stored.getPasswordHash())).isTrue();
    }

    @Test
    void registerRejectsADuplicateEmail() {
        when(repository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
                service.register(new RegisterRequest("taken@example.com", "correcthorse")))
                .isInstanceOf(EmailAlreadyUsedException.class);
    }

    @Test
    void loginReturnsATokenForValidCredentials() {
        User user = existingUser("pawan@example.com", "correcthorse");
        when(repository.findByEmail("pawan@example.com")).thenReturn(Optional.of(user));
        when(tokenService.issue(user)).thenReturn(
                new TokenService.IssuedToken("a.b.c", Instant.now().plusSeconds(3600)));

        LoginResponse response = service.login(
                new LoginRequest("Pawan@Example.COM", "correcthorse"));

        assertThat(response.token()).isEqualTo("a.b.c");
        assertThat(response.email()).isEqualTo("pawan@example.com");
    }

    @Test
    void loginRejectsAnUnknownEmail() {
        when(repository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.login(new LoginRequest("nobody@example.com", "whatever")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRejectsAWrongPassword() {
        when(repository.findByEmail("pawan@example.com"))
                .thenReturn(Optional.of(existingUser("pawan@example.com", "correcthorse")));

        assertThatThrownBy(() ->
                service.login(new LoginRequest("pawan@example.com", "wrongpassword")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    private User existingUser(String email, String rawPassword) {
        return new User(email, passwordEncoder.encode(rawPassword));
    }
}