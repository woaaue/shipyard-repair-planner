package com.shipyard.repair.mapper.user;

import com.shipyard.repair.dto.user.CreateUserRequest;
import com.shipyard.repair.dto.user.UserResponse;
import com.shipyard.repair.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    User toEntity(CreateUserRequest request);

    @Mapping(target = "reportsToUserId", source = "reportsTo.id")
    @Mapping(target = "reportsToFullName", expression = "java(toFullName(user.getReportsTo()))")
    UserResponse toResponse(User user);

    default String toFullName(User user) {
        if (user == null) {
            return null;
        }
        String patronymic = user.getPatronymic() == null || user.getPatronymic().isBlank()
                ? ""
                : " " + user.getPatronymic();
        return (user.getLastName() + " " + user.getFirstName() + patronymic).trim();
    }
}
