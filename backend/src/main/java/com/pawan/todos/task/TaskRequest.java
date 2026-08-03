package com.pawan.todos.task;

import java.time.Instant;

public record TaskRequest(
        String title,
        String description,
        Priority priority,
        String category,
        Instant dueDate,
        boolean completed
) {}