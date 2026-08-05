package com.pawan.todos;

import com.pawan.todos.task.Priority;
import com.pawan.todos.task.Task;
import com.pawan.todos.task.TaskRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;   // ← Boot 4 package

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TaskRepositoryTest {

    @Autowired
    private TaskRepository repository;

    @Test
    void saveAssignsIdAndTimestamps() {
        Task task = new Task("Write tests", "module 8", Priority.MEDIUM, "Work", null);

        Task saved = repository.save(task);

        assertThat(saved.getId()).isNotNull();               // @GeneratedValue
        assertThat(saved.getCreatedAt()).isNotNull();        // @PrePersist
        assertThat(saved.getUpdatedAt()).isEqualTo(saved.getCreatedAt());
    }

    @Test
    void findByCompletedFiltersOnTheFlag() {
        Task done = new Task("done", null, Priority.LOW, "Work", null);
        done.setCompleted(true);
        repository.save(done);
        repository.save(new Task("pending", null, Priority.LOW, "Work", null));

        List<Task> completed = repository.findByCompleted(true);

        assertThat(completed).hasSize(1);
        assertThat(completed.getFirst().getTitle()).isEqualTo("done");
    }

    @Test
    void titleSearchIsCaseInsensitiveAndPartial() {
        repository.save(new Task("Buy Oat Milk", null, Priority.LOW, "Shopping", null));

        assertThat(repository.findByTitleContainingIgnoreCase("oat milk")).hasSize(1);
        assertThat(repository.findByTitleContainingIgnoreCase("BUY")).hasSize(1);
        assertThat(repository.findByTitleContainingIgnoreCase("bread")).isEmpty();
    }
}