package com.shipyard.repair.exception;

import lombok.Getter;

@Getter
public class BadRequestException extends RuntimeException {

    private final ErrorCode errorCode;

    public BadRequestException(ErrorCode errorCode) {
        super(errorCode.getMessageCode());
        this.errorCode = errorCode;
    }
}
