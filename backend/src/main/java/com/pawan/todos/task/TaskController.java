package com.pawan.todos.task;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/tasks")                  // ① base path for the whole class
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public List<TaskResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.findAll(ownerId(jwt));
    }

    @GetMapping("/{id}")
    public TaskResponse one(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {      // ③ String → UUID conversion
        return service.findById(ownerId(jwt), id);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody TaskRequest request) {
        TaskResponse created = service.create(ownerId(jwt), request);
        return ResponseEntity
                .created(URI.create("/api/tasks/" + created.id()))   // ④ 201 + Location
                .body(created);
    }

    @PutMapping("/{id}")
    public TaskResponse update(@AuthenticationPrincipal Jwt jwt,
                               @PathVariable UUID id,
                              @Valid @RequestBody TaskRequest request) {
        return service.update(ownerId(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)     // ⑤ 204, empty body
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.delete(ownerId(jwt), id);
    }

    private static UUID ownerId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}