package com.shipyard.repair.converter;

import com.shipyard.repair.enums.DockStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class DockStatusConverter implements AttributeConverter<DockStatus, String> {

    @Override
    public String convertToDatabaseColumn(DockStatus attribute) {
        if (attribute == null) {
            throw new IllegalArgumentException("DockStatus can't be null");
        }
        return attribute.name();
    }

    @Override
    public DockStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            throw new IllegalArgumentException("DockStatus can't be null");
        }

        try {
            return DockStatus.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            return DockStatus.AVAILABLE;
        }
    }
}
