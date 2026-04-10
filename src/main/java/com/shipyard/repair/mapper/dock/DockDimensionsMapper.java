package com.shipyard.repair.mapper.dock;

import com.shipyard.repair.dto.dock.DockDimensionsResponse;
import com.shipyard.repair.embeddable.DockDimensions;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DockDimensionsMapper {

    DockDimensionsResponse toDto(DockDimensions entity);
}
