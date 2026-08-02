package com.pawan.todos.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByCompleted(boolean completed);

    List<Task> findByCategory(String category);

    long countByCategory(String category);

    List<Task> findByTitleContainingIgnoreCase(String fragment);
}