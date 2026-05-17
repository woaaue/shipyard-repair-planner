package com.shipyard.repair.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    USER_NOT_FOUND("user.not.found"),
    USER_ALREADY_EXISTS("user.already.exists"),
    DOCK_NOT_FOUND("dock.not.found"),
    SHIP_NOT_FOUND("ship.not.found"),
    SHIP_ALREADY_EXISTS("ship.already.exists"),
    REPAIR_REQUEST_NOT_FOUND("repairRequest.not.found"),
    REPAIR_NOT_FOUND("repair.not.found"),
    WORK_ITEM_NOT_FOUND("workItem.not.found"),
    SHIPYARD_NOT_FOUND("shipyard.not.found"),
    SHIPYARD_ALREADY_EXISTS("shipyard.already.exists"),
    SHIPYARD_DEACTIVATION_HAS_ACTIVE_DOCKS("shipyard.deactivation.has.active.docks"),
    SHIPYARD_DEACTIVATION_HAS_ACTIVE_REPAIRS("shipyard.deactivation.has.active.repairs"),
    SHIPYARD_INACTIVE_FOR_DOCK("shipyard.inactive.for.dock"),
    DOCK_DEACTIVATION_HAS_ACTIVE_REPAIRS("dock.deactivation.has.active.repairs"),
    DOCK_HAS_NO_OPERATOR("dock.has.no.operator"),
    TYPE_MISMATCH("type.mismatch"),
    MISSING_PARAMETER("missing.parameter"),
    INVALID_JSON("invalid.json"),
    BAD_REQUEST("bad.request"),
    ID_IS_NULL("id.is.null"),;

    private final String messageCode;
}
