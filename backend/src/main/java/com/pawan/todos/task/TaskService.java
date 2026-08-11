package com.pawan.todos.task;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import com.pawan.todos.user.User;
import com.pawan.todos.user.UserRepository;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository repository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public List<TaskResponse> findAll(UUID ownerId) {
        return repository.findByOwnerId(ownerId).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse findById(UUID ownerId, UUID id) {
        return TaskResponse.from(get(ownerId, id));
    }

    @Transactional
    public TaskResponse create(UUID ownerId, TaskRequest request) {
        User owner = userRepository.getReferenceById(ownerId);
        Task task = new Task(request.title(), request.description(),
                request.priority(), request.category(), request.dueDate(), owner);
        task.setCompleted(Boolean.TRUE.equals(request.completed()));
        return TaskResponse.from(repository.save(task));
    }

    @Transactional
    public TaskResponse update(UUID ownerId, UUID id, TaskRequest request) {
        Task task = get(ownerId, id);
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
    public void delete(UUID ownerId, UUID id) {
        repository.delete(get(ownerId, id));
    }

    private Task get(UUID ownerId, UUID id) {
        return repository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new TaskNotFoundException(id));
    }
}