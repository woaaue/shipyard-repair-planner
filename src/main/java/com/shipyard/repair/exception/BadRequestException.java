package com.shipyard.repair.exception;

import lombok.Getter;

@Getter
public class BadRequestException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Object[] messageArgs;

    public BadRequestException(ErrorCode errorCode) {
        super(errorCode.getMessageCode());
        this.errorCode = errorCode;
        this.messageArgs = null;
    }

    public BadRequestException(ErrorCode errorCode, Object[] messageArgs) {
        super(errorCode.getMessageCode());
        this.errorCode = errorCode;
        this.messageArgs = messageArgs;
    }
}
