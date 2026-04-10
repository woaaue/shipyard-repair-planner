package com.shipyard.repair.mapper.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    @Mapping(source = "dock.id", target = "dockId")
    User toEntity(CreateUserRequest request);
}
