package com.pawan.todos.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByOwnerIdAndCompleted(UUID ownerId, boolean completed);

    List<Task> findByOwnerIdAndCategory(UUID ownerId, String category);

    long countByOwnerIdAndCategory(UUID ownerId, String category);

    List<Task> findByOwnerIdAndTitleContainingIgnoreCase(UUID ownerId, String fragment);

    List<Task> findByOwnerId(UUID ownerId);

    Optional<Task> findByIdAndOwnerId(UUID id, UUID ownerId);
}