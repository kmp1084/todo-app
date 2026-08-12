package com.pawan.todos.user;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    private static String credentials(String email) {
        return "{\"email\":\"" + email + "\",\"password\":\"correcthorse\"}";
    }

    private String registerAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(credentials(email)))
                .andExpect(status().isCreated());

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(credentials(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(body, "$.token");
    }

    @Test
    void tasksRequireAToken() throws Exception {
        mockMvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void garbageTokensAreRejected() throws Exception {
        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer not-a-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerThenLoginThenReachTasks() throws Exception {
        String token = registerAndLogin(uniqueEmail());

        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void duplicateRegistrationIsRejected() throws Exception {
        String payload = credentials(uniqueEmail());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidRegistrationInputReturnsFieldErrors() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void bothLoginFailuresAreIndistinguishable() throws Exception {
        String email = uniqueEmail();
        registerAndLogin(email);

        String wrongPassword = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"wrongpassword\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        String unknownUser = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\",\"password\":\"whatever\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(wrongPassword).isEqualTo(unknownUser);
    }

    @Test
    void twoUsersCannotSeeEachOthersTasks() throws Exception {
        String tokenA = registerAndLogin(uniqueEmail());
        String tokenB = registerAndLogin(uniqueEmail());

        String created = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"A task\",\"priority\":\"high\","
                               + "\"category\":\"Work\",\"completed\":false}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String taskId = JsonPath.read(created, "$.id");

        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get("/api/tasks/" + taskId).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }
}