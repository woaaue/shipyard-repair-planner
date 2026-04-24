package com.shipyard.repair.audit;

import com.shipyard.repair.service.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Locale;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogService auditLogService;

    @AfterReturning(
            value = "execution(* com.shipyard.repair.service..*ServiceImpl.create*(..)) || " +
                    "execution(* com.shipyard.repair.service..*ServiceImpl.update*(..)) || " +
                    "execution(* com.shipyard.repair.service..*ServiceImpl.delete*(..)) || " +
                    "execution(* com.shipyard.repair.service.user.UserServiceImpl.blockUser(..)) || " +
                    "execution(* com.shipyard.repair.service.user.UserServiceImpl.unblockUser(..)) || " +
                    "execution(* com.shipyard.repair.service.user.UserServiceImpl.resetPassword(..))",
            returning = "result"
    )
    public void logMutations(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        String entityType = toEntityType(joinPoint.getTarget().getClass().getSimpleName());
        String action = toAction(methodName);
        Integer entityId = resolveEntityId(joinPoint.getArgs(), result);

        auditLogService.log(action, entityType, entityId, methodName);
    }

    private String toEntityType(String serviceImplName) {
        String raw = serviceImplName.replace("ServiceImpl", "");
        return raw.replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase(Locale.ROOT);
    }

    private String toAction(String methodName) {
        String lower = methodName.toLowerCase(Locale.ROOT);
        if (lower.startsWith("create")) {
            return "CREATE";
        }
        if (lower.startsWith("update")) {
            return lower.contains("status") ? "STATUS_CHANGE" : "UPDATE";
        }
        if (lower.startsWith("delete")) {
            return "DELETE";
        }
        if (lower.startsWith("block")) {
            return "BLOCK";
        }
        if (lower.startsWith("unblock")) {
            return "UNBLOCK";
        }
        if (lower.startsWith("reset")) {
            return "RESET_PASSWORD";
        }
        return "MUTATION";
    }

    private Integer resolveEntityId(Object[] args, Object result) {
        if (args.length > 0 && args[0] instanceof Integer id) {
            return id;
        }
        if (result == null) {
            return null;
        }
        try {
            Method recordAccessor = result.getClass().getMethod("id");
            Object value = recordAccessor.invoke(result);
            return value instanceof Integer id ? id : null;
        } catch (Exception ignored) {
        }
        try {
            Method beanGetter = result.getClass().getMethod("getId");
            Object value = beanGetter.invoke(result);
            return value instanceof Integer id ? id : null;
        } catch (Exception ignored) {
            return null;
        }
    }
}
