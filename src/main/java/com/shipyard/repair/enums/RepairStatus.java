package com.shipyard.repair.enums;

public enum RepairStatus {
    SCHEDULED,     // запланирован
    STARTED,       // начат
    IN_PROGRESS,   // в процессе
    QA,           // контроль качества
    COMPLETED,     // завершён
    CANCELLED      // отменён
}