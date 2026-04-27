package com.shipyard.repair.service.downtime;

import com.shipyard.repair.dto.downtime.CreateDowntimeRequest;
import com.shipyard.repair.dto.downtime.DowntimeResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface DowntimeService {

    List<DowntimeResponse> getDowntimes(String dockName, boolean activeOnly);

    DowntimeResponse createDowntime(CreateDowntimeRequest request);

    DowntimeResponse finishDowntime(Integer id, LocalDateTime endDate);
}
