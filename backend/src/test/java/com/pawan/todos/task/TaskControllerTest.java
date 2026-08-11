package com.pawan.todos.task;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    private static final UUID OWNER_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService service;

    /** Authenticates the request as OWNER_ID, matching what the JWT filter would produce. */
    private static RequestPostProcessor asOwner() {
        return jwt().jwt(j -> j.subject(OWNER_ID.toString()));
    }

    @Test
    void listReturnsTasksAsJsonWithLowercasePriority() throws Exception {
        TaskResponse task = new TaskResponse(UUID.randomUUID(), "Buy milk", null, false,
                Priority.HIGH, "Shopping", null, Instant.now(), Instant.now());
        when(service.findAll(OWNER_ID)).thenReturn(List.of(task));

        mockMvc.perform(get("/api/tasks").with(asOwner()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Buy milk"))
                .andExpect(jsonPath("$[0].priority").value("high"));
    }

    @Test
    void blankFieldsReturn400WithPerFieldErrors() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .with(asOwner()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"","category":"","completed":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.errors.title").exists())
                .andExpect(jsonPath("$.errors.category").exists())
                .andExpect(jsonPath("$.errors.priority").exists());
    }

    @Test
    void unknownIdReturns404ProblemDetail() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.findById(OWNER_ID, id)).thenThrow(new TaskNotFoundException(id));

        mockMvc.perform(get("/api/tasks/" + id).with(asOwner()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Task not found"));
    }
}