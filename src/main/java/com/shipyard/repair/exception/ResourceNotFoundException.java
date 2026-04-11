package com.shipyard.repair.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {
    
    private final ErrorCode errorCode;

    public ResourceNotFoundException(ErrorCode errorCode) {
        super(errorCode.getMessageCode());
        this.errorCode = errorCode;
    }
}
