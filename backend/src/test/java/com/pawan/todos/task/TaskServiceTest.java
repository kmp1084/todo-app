package com.pawan.todos;

import com.pawan.todos.task.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)          // ① wires up @Mock / @InjectMocks
class TaskServiceTest {

    @Mock                                     // ② a fake TaskRepository
    private TaskRepository repository;

    @InjectMocks                              // ③ real TaskService, mock passed to its constructor
    private TaskService service;

    @Test
    void createMapsRequestFieldsAndDefaultsCompletedToFalse() {
        when(repository.save(any(Task.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));   // ④ echo it back

        TaskRequest request = new TaskRequest("Buy milk", "2 percent",
                Priority.HIGH, "Shopping", null, null);   // ⑤ completed = null

        TaskResponse response = service.create(request);

        assertThat(response.title()).isEqualTo("Buy milk");
        assertThat(response.priority()).isEqualTo(Priority.HIGH);
        assertThat(response.completed()).isFalse();       // Boolean.TRUE.equals(null) → false
    }

    @Test
    void findByIdThrowsWhenTheTaskDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessageContaining(id.toString());
    }
}