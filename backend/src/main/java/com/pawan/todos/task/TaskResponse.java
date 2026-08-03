package com.pawan.todos.task;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(          // ① record: immutable, compiler-generated members
        UUID id,
        String title,
        String description,
        boolean completed,
        Priority priority,
        String category,
        Instant dueDate,
        Instant createdAt,
        Instant updatedAt
) {
    static TaskResponse from(Task task) {      // ② static factory = the mapper
        return new TaskResponse(
                task.getId(), task.getTitle(), task.getDescription(),
                task.isCompleted(), task.getPriority(), task.getCategory(),
                task.getDueDate(), task.getCreatedAt(), task.getUpdatedAt());
    }
}