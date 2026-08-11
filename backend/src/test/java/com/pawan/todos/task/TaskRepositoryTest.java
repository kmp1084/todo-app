package com.pawan.todos.task;

import com.pawan.todos.user.User;
import com.pawan.todos.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TaskRepositoryTest {

    @Autowired
    private TaskRepository repository;

    @Autowired
    private UserRepository users;

    private User owner;

    @BeforeEach
    void setUp() {
        owner = users.save(new User("owner@example.com", "hash"));
    }

    @Test
    void saveAssignsIdAndTimestamps() {
        Task task = new Task("Write tests", "module 8", Priority.MEDIUM, "Work", null, owner);

        Task saved = repository.save(task);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isEqualTo(saved.getCreatedAt());
    }

    @Test
    void findByCompletedFiltersOnTheFlag() {
        Task done = new Task("done", null, Priority.LOW, "Work", null, owner);
        done.setCompleted(true);
        repository.save(done);
        repository.save(new Task("pending", null, Priority.LOW, "Work", null, owner));

        List<Task> completed = repository.findByOwnerIdAndCompleted(owner.getId(), true);

        assertThat(completed).hasSize(1);
        assertThat(completed.getFirst().getTitle()).isEqualTo("done");
    }

    @Test
    void titleSearchIsCaseInsensitiveAndScopedToTheOwner() {
        User other = users.save(new User("other@example.com", "hash"));
        repository.save(new Task("Buy Oat Milk", null, Priority.LOW, "Shopping", null, owner));
        repository.save(new Task("Buy Oat Milk", null, Priority.LOW, "Shopping", null, other));

        UUID id = owner.getId();
        assertThat(repository.findByOwnerIdAndTitleContainingIgnoreCase(id, "oat milk")).hasSize(1);
        assertThat(repository.findByOwnerIdAndTitleContainingIgnoreCase(id, "BUY")).hasSize(1);
        assertThat(repository.findByOwnerIdAndTitleContainingIgnoreCase(id, "bread")).isEmpty();
    }

    @Test
    void findByOwnerIdReturnsOnlyThatUsersTasks() {
        User other = users.save(new User("other@example.com", "hash"));
        repository.save(new Task("mine", null, Priority.LOW, "Work", null, owner));
        repository.save(new Task("theirs", null, Priority.LOW, "Work", null, other));

        List<Task> mine = repository.findByOwnerId(owner.getId());

        assertThat(mine).hasSize(1);
        assertThat(mine.getFirst().getTitle()).isEqualTo("mine");
    }
}