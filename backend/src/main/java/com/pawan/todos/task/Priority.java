package com.pawan.todos.task;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum Priority {
    @JsonProperty("low") LOW,
    @JsonProperty("medium") MEDIUM,
    @JsonProperty("high") HIGH
}
