package com.shipyard.repair.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    USER_NOT_FOUND("user.not.found"),
    USER_ALREADY_EXISTS("user.already.exists"),
    DOCK_NOT_FOUND("dock.not.found");

    private final String messageCode;
}
