package com.shipyard.repair.exception;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
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
        String message = messageSource.getMessage(ex.getErrorCode().getMessageCode(), null, Locale.getDefault());
        ErrorResponse error = new ErrorResponse(message, ex.getErrorCode().name(), System.currentTimeMillis());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        String message = messageSource.getMessage(ex.getErrorCode().getMessageCode(), null, Locale.getDefault());
        ErrorResponse error = new ErrorResponse(message, ex.getErrorCode().name(), System.currentTimeMillis());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        ErrorCode errorCode = ErrorCode.TYPE_MISMATCH;
        String message = messageSource.getMessage(
                errorCode.getMessageCode(),
                new Object[]{ex.getName(), ex.getRequiredType().getSimpleName()},
                Locale.getDefault());

        ErrorResponse error = new ErrorResponse(message, errorCode.name(), System.currentTimeMillis());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParams(MissingServletRequestParameterException ex) {
        ErrorCode errorCode = ErrorCode.MISSING_PARAMETER;
        String message = messageSource.getMessage(errorCode.getMessageCode(), new Object[]{ex.getParameterName()}, Locale.getDefault());
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
        String message = messageSource.getMessage(errorCode.getMessageCode(), null, Locale.getDefault());
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
        String message = messageSource.getMessage(ex.getErrorCode().getMessageCode(), null, Locale.getDefault());
        ErrorResponse error = new ErrorResponse(
            errorCode.getMessageCode(),
            errorCode.name(),
            System.currentTimeMillis()
        );

        return ResponseEntity.badRequest().body(error);
    }
}
