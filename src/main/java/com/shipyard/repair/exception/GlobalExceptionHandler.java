package com.shipyard.repair.exception;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    private String resolveMessage(ErrorCode errorCode, Object[] args) {
        try {
            return messageSource.getMessage(
                    errorCode.getMessageCode(),
                    args,
                    Locale.getDefault()
            );
        } catch (NoSuchMessageException ignored) {
            return errorCode.getMessageCode();
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach((error) -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(DuplicateResourceException ex) {
        String message = resolveMessage(ex.getErrorCode(), null);
        ErrorResponse error = new ErrorResponse(message, ex.getErrorCode().name(), System.currentTimeMillis());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        String message = resolveMessage(ex.getErrorCode(), null);
        ErrorResponse error = new ErrorResponse(message, ex.getErrorCode().name(), System.currentTimeMillis());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        ErrorCode errorCode = ErrorCode.TYPE_MISMATCH;
        String message = resolveMessage(errorCode, new Object[]{ex.getName(), ex.getRequiredType().getSimpleName()});

        ErrorResponse error = new ErrorResponse(message, errorCode.name(), System.currentTimeMillis());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParams(MissingServletRequestParameterException ex) {
        ErrorCode errorCode = ErrorCode.MISSING_PARAMETER;
        String message = resolveMessage(errorCode, new Object[]{ex.getParameterName()});
        ErrorResponse error = new ErrorResponse(
            message,
            errorCode.name(),
            System.currentTimeMillis()
        );
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        ErrorCode errorCode = ErrorCode.INVALID_JSON;
        String message = resolveMessage(errorCode, null);
        ErrorResponse error = new ErrorResponse(
                message,
                errorCode.name(),
                System.currentTimeMillis()
        );
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorResponse error = new ErrorResponse(
            ex.getMessage(),
            ErrorCode.BAD_REQUEST.name(),
            System.currentTimeMillis()
        );
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(BadRequestException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        String message = resolveMessage(ex.getErrorCode(), ex.getMessageArgs());
        ErrorResponse error = new ErrorResponse(
            message,
            errorCode.name(),
            System.currentTimeMillis()
        );

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex) {
        ErrorResponse error = new ErrorResponse(
                "Invalid email or password",
                "UNAUTHORIZED",
                System.currentTimeMillis()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        ErrorResponse error = new ErrorResponse(
                "Access denied",
                "FORBIDDEN",
                System.currentTimeMillis()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
}
