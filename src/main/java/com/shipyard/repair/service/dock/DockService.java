package com.shipyard.repair.service.dock;

import com.shipyard.repair.dto.dock.CreateDockRequest;
import com.shipyard.repair.dto.dock.DockResponse;

import java.util.List;

public interface DockService {

    List<DockResponse> getDocks();
    DockResponse getDock(Integer id);
    DockResponse createDock(CreateDockRequest request);
    void deleteDock(Integer id);
}
