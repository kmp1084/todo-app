package com.pawan.todos.task;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")                  // ① base path for the whole class
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping                                // ② GET /api/tasks
    public List<TaskResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public TaskResponse one(@PathVariable UUID id) {      // ③ String → UUID conversion
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskRequest request) {
        TaskResponse created = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/tasks/" + created.id()))   // ④ 201 + Location
                .body(created);
    }

    @PutMapping("/{id}")
    public TaskResponse update(@PathVariable UUID id,
                              @Valid @RequestBody TaskRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)     // ⑤ 204, empty body
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}