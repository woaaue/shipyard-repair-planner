package com.shipyard.repair.service.downtime;

import com.shipyard.repair.dto.downtime.CreateDowntimeRequest;
import com.shipyard.repair.dto.downtime.DowntimeResponse;
import com.shipyard.repair.entity.Downtime;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.repository.DowntimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DowntimeServiceImpl implements DowntimeService {

    private final DowntimeRepository downtimeRepository;

    @Override
    public List<DowntimeResponse> getDowntimes(String dockName, boolean activeOnly) {
        List<Downtime> source = dockName == null || dockName.isBlank()
                ? downtimeRepository.findAll()
                : downtimeRepository.findByDockNameIgnoreCase(dockName);

        return source.stream()
                .filter(downtime -> !activeOnly || downtime.getEndDate() == null)
                .sorted((left, right) -> right.getStartDate().compareTo(left.getStartDate()))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public DowntimeResponse createDowntime(CreateDowntimeRequest request) {
        Downtime downtime = new Downtime();
        downtime.setDockName(request.dockName());
        downtime.setReason(request.reason());
        downtime.setStartDate(request.startDate());
        downtime.setExpectedEndDate(request.expectedEndDate());
        downtime.setNotes(request.notes());
        Downtime saved = downtimeRepository.save(downtime);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public DowntimeResponse finishDowntime(Integer id, LocalDateTime endDate) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        Downtime downtime = downtimeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Downtime not found"));
        downtime.setEndDate(endDate == null ? LocalDateTime.now() : endDate);
        Downtime saved = downtimeRepository.save(downtime);
        return toResponse(saved);
    }

    private DowntimeResponse toResponse(Downtime downtime) {
        return new DowntimeResponse(
                downtime.getId(),
                downtime.getDockName(),
                downtime.getReason(),
                downtime.getStartDate(),
                downtime.getEndDate(),
                downtime.getExpectedEndDate(),
                downtime.getNotes(),
                downtime.getCreatedAt()
        );
    }
}
