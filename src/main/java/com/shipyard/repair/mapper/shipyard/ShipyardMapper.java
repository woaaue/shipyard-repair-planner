package com.shipyard.repair.mapper.shipyard;

import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.entity.Shipyard;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = ShipyardAddressMapper.class)
public interface ShipyardMapper {

    ShipyardResponse toDto(Shipyard shipyard);

    Shipyard toEntity(CreateShipyardRequest createShipyardRequest);
}