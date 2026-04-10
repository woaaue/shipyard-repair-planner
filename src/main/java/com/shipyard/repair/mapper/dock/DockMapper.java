package com.shipyard.repair.mapper.dock;

import com.shipyard.repair.dto.dock.DockResponse;
import com.shipyard.repair.entity.Dock;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DockMapper {

    DockResponse toDto(Dock entity);
}
