package com.shipyard.repair.converter;

import com.shipyard.repair.enums.UserRole;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class UserRoleConverter implements AttributeConverter<UserRole, String> {

    @Override
    public String convertToDatabaseColumn(UserRole attribute) {
        if (attribute == null) {
            throw new IllegalStateException("UserRole cannot be null when saving to database");
        }
        return attribute.name();
    }

    @Override
    public UserRole convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            throw new IllegalStateException("DB data cannot be null");
        }

        try {
            return UserRole.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Unknown UserRole value in database: " + dbData);
        }
    }
}
