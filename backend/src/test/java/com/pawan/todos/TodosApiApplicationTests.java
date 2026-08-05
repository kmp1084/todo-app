package com.pawan.todos;

import org.junit.jupiter.api.Test;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@AutoConfigureTestDatabase          // swap the file DB for an in-memory one
class TodosApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
