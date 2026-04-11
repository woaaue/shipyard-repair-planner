package com.shipyard.repair.exception;

import lombok.Getter;

@Getter
public class DuplicateResourceException extends RuntimeException {
    
    private final ErrorCode errorCode;

    public DuplicateResourceException(ErrorCode errorCode) {
        super(errorCode.getMessageCode());
        this.errorCode = errorCode;
    }
}
