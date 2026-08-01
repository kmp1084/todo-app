package com.pawan.todos;                      // must match the folder path

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;

@RestController                               // ① this class handles HTTP, returns data not views
@RequestMapping("/api")                       // ② URL prefix for every method in this class
public class PingController {

    public record PingResponse(String status, Instant time) {}

    @GetMapping("/ping")                      // ③ GET /api/ping
    public String ping() {                    // ④ return type      method name + params
        return "pong";
    }

    @GetMapping("/health")
    public PingResponse health() {
        return new PingResponse("up", Instant.now());
    }
}