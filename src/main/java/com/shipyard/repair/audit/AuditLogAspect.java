package com.shipyard.repair.audit;

import com.shipyard.repair.service.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogService auditLogService;

    @AfterReturning(
            value = "(" +
                    "execution(* com.shipyard.repair.service..*ServiceImpl.create*(..)) || " +
                    "execution(* com.shipyard.repair.service..*ServiceImpl.update*(..)) || " +
                    "execution(* com.shipyard.repair.service..*ServiceImpl.delete*(..)) || " +
                    "execution(* com.shipyard.repair.service.user.UserServiceImpl.blockUser(..)) || " +
                    "execution(* com.shipyard.repair.service.user.UserServiceImpl.unblockUser(..)) || " +
                    "execution(* com.shipyard.repair.service.user.UserServiceImpl.resetPassword(..))" +
                    ")" +
                    " && !execution(* com.shipyard.repair.service.shipyard.ShipyardServiceImpl.updateShipyard(..))" +
                    " && !execution(* com.shipyard.repair.service.shipyard.ShipyardServiceImpl.updateShipyardStatus(..))" +
                    " && !execution(* com.shipyard.repair.service.dock.DockServiceImpl.updateDock(..))",
            returning = "result"
    )
    public void logMutations(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        String entityType = toEntityType(joinPoint.getTarget().getClass().getSimpleName());
        String action = toAction(methodName);
        Integer entityId = resolveEntityId(joinPoint.getArgs(), result);
        String details = buildDetails(joinPoint, methodName, entityId, result);

        auditLogService.log(action, entityType, entityId, details);
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

    private String buildDetails(JoinPoint joinPoint, String methodName, Integer entityId, Object result) {
        List<String> parts = new ArrayList<>();
        parts.add("method=" + methodName);
        if (entityId != null) {
            parts.add("entityId=" + entityId);
        }

        String argsSummary = summarizeArgs(joinPoint);
        if (!argsSummary.isBlank()) {
            parts.add("args=" + argsSummary);
        }

        Integer resultId = resolveEntityId(new Object[0], result);
        if (resultId != null) {
            parts.add("resultId=" + resultId);
        }

        String details = String.join("; ", parts);
        return details.length() > 1000 ? details.substring(0, 1000) : details;
    }

    private String summarizeArgs(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args == null || args.length == 0) {
            return "";
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] names = signature.getParameterNames();
        List<String> rendered = new ArrayList<>();

        for (int i = 0; i < args.length; i++) {
            Object arg = args[i];
            String name = (names != null && i < names.length && names[i] != null) ? names[i] : ("arg" + i);
            rendered.add(name + "=" + summarizeArg(arg));
        }

        return String.join(", ", rendered);
    }

    private String summarizeArg(Object arg) {
        if (arg == null) {
            return "null";
        }
        if (arg instanceof String || arg instanceof Number || arg instanceof Boolean || arg.getClass().isEnum()) {
            return String.valueOf(arg);
        }

        String packageName = arg.getClass().getPackageName();
        if (packageName.startsWith("com.shipyard.repair.dto")) {
            String value = String.valueOf(arg);
            return value.length() > 400 ? value.substring(0, 400) : value;
        }

        return arg.getClass().getSimpleName();
    }
}
