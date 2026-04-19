package com.shipyard.repair.service.dock;

import com.shipyard.repair.dto.dock.CreateDockRequest;
import com.shipyard.repair.dto.dock.DockScheduleItemResponse;
import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.dto.dock.UpdateDockRequest;

import java.time.LocalDate;
import java.util.List;

public interface DockService {

    List<DockResponse> getDocks();
    DockResponse getDock(Integer id);
    DockResponse createDock(CreateDockRequest request);
    DockResponse updateDock(Integer id, UpdateDockRequest request);
    List<DockScheduleItemResponse> getDockSchedule(Integer id, LocalDate startDate, LocalDate endDate);
    Integer getDockLoad(Integer id);
    void deleteDock(Integer id);
}
