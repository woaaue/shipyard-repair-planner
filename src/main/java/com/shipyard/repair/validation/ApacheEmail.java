package com.shipyard.repair.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ApacheEmailValidator.class)
public @interface ApacheEmail {
    String message() default "Invalid mail format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
