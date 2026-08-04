package com.pawan.todos.task;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public List<TaskResponse> findAll() {
        return repository.findAll().stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse findById(UUID id) {
        return TaskResponse.from(get(id));
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = new Task(request.title(), request.description(),
                request.priority(), request.category(), request.dueDate());
        task.setCompleted(Boolean.TRUE.equals(request.completed()));
        return TaskResponse.from(repository.save(task));
    }

    @Transactional
    public TaskResponse update(UUID id, TaskRequest request) {
        Task task = get(id);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(request.priority());
        task.setCategory(request.category());
        task.setDueDate(request.dueDate());
        task.setCompleted(Boolean.TRUE.equals(request.completed()));
        repository.flush(); // force the UPDATE now so @PreUpdate sets updatedAt before we map
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(get(id));
    }

    private Task get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
    }
}