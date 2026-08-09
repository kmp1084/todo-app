package com.pawan.todos;

import com.pawan.todos.task.TaskNotFoundException;
import com.pawan.todos.user.EmailAlreadyUsedException;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {   // ← extends

    @ExceptionHandler(TaskNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(TaskNotFoundException ex) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        body.setTitle("Task not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @Override                                          // ① override, don't add
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        ProblemDetail body = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "One or more fields are invalid");
        body.setTitle("Validation failed");

        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        body.setProperty("errors", errors);

        return handleExceptionInternal(ex, body, headers, HttpStatus.BAD_REQUEST, request);  // ②
    }

    @ExceptionHandler(EmailAlreadyUsedException.class)
    public ResponseEntity<ProblemDetail> handleEmailTaken(EmailAlreadyUsedException ex) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        body.setTitle("Email already registered");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }
}