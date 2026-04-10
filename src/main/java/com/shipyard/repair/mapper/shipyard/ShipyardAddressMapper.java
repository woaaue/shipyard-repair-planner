package com.shipyard.repair.mapper.shipyard;

import com.shipyard.repair.dto.shipyard.ShipyardAddressResponse;
import com.shipyard.repair.embeddable.ShipyardAddress;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ShipyardAddressMapper {

    ShipyardAddressResponse toDto(ShipyardAddress shipyardAddress);
}
