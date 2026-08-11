package com.pawan.todos.task;

import com.pawan.todos.user.User;
import com.pawan.todos.user.UserRepository;
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

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository repository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService service;

    private final UUID ownerId = UUID.randomUUID();

    @Test
    void createMapsRequestFieldsAndDefaultsCompletedToFalse() {
        when(userRepository.getReferenceById(ownerId))
                .thenReturn(new User("a@example.com", "hash"));
        when(repository.save(any(Task.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        TaskRequest request = new TaskRequest("Buy milk", "2 percent",
                Priority.HIGH, "Shopping", null, null);

        TaskResponse response = service.create(ownerId, request);

        assertThat(response.title()).isEqualTo("Buy milk");
        assertThat(response.priority()).isEqualTo(Priority.HIGH);
        assertThat(response.completed()).isFalse();
    }

    @Test
    void findByIdThrowsWhenTheTaskIsNotOwnedByTheUser() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndOwnerId(id, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(ownerId, id))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessageContaining(id.toString());
    }
}