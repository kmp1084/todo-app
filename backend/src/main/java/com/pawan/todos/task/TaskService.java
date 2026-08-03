package com.pawan.todos.task;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service                                       // ① a bean; also documents intent
public class TaskService {

    private final TaskRepository repository;   // ② final: assigned once, in the constructor

    public TaskService(TaskRepository repository) {
        this.repository = repository;          // ③ constructor injection - the proxy from Module 4
    }

    public List<TaskResponse> findAll() {
        return repository.findAll().stream()   // ④ stream ≈ a JS array chain
                .map(TaskResponse::from)       // ⑤ method reference ≈ t -> TaskResponse.from(t)
                .toList();
    }

    public TaskResponse findById(UUID id) {
        return TaskResponse.from(get(id));
    }

    public TaskResponse create(TaskRequest request) {
        Task task = new Task(request.title(), request.description(),
                request.priority(), request.category(), request.dueDate());
        task.setCompleted(request.completed());
        return TaskResponse.from(repository.save(task));   // ⑥ id is null → persist
    }

    public TaskResponse update(UUID id, TaskRequest request) {
        Task task = get(id);                   // ⑦ loads, then DETACHES (see below)
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(request.priority());
        task.setCategory(request.category());
        task.setDueDate(request.dueDate());
        task.setCompleted(request.completed());
        return TaskResponse.from(repository.save(task));   // ⑧ id is set → merge
    }

    public void delete(UUID id) {
        repository.delete(get(id));
    }

    private Task get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Task not found: " + id));
    }
}