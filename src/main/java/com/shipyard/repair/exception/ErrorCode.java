package com.shipyard.repair.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    USER_NOT_FOUND("user.not.found"),
    USER_ALREADY_EXISTS("user.already.exists"),
    DOCK_NOT_FOUND("dock.not.found"),
    SHIPYARD_NOT_FOUND("shipyard.not.found"),
    TYPE_MISMATCH("type.mismatch"),
    MISSING_PARAMETER("missing.parameter"),
    INVALID_JSON("invalid.json"),
    BAD_REQUEST("bad.request"),
    ID_IS_NULL("id.is.null"),;

    private final String messageCode;
}
