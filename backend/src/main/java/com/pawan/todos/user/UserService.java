package com.pawan.todos.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalise(request.email());

        if (repository.existsByEmail(email)) {
            throw new EmailAlreadyUsedException(email);
        }

        String hash = passwordEncoder.encode(request.password());
        return UserResponse.from(repository.save(new User(email, hash)));
    }

    static String normalise(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public LoginResponse login(LoginRequest request) {
        User user = repository.findByEmail(normalise(request.email()))
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        TokenService.IssuedToken token = tokenService.issue(user);
        return new LoginResponse(token.value(), token.expiresAt(), user.getEmail());
    }
}