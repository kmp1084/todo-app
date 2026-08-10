package com.pawan.todos.user;

import java.time.Instant;

public record LoginResponse(String token, Instant expiresAt, String email) {}