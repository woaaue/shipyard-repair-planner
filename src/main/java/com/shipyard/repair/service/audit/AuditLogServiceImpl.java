package com.shipyard.repair.service.audit;

import com.shipyard.repair.dto.audit.AuditLogResponse;
import com.shipyard.repair.entity.AuditLog;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.repository.AuditLogRepository;
import com.shipyard.repair.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    public List<AuditLogResponse> getAuditLogs(
            String entityType,
            Integer entityId,
            Integer userId,
            String action,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return auditLogRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(root.get("entityType"), entityType.toUpperCase(Locale.ROOT)));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.join("actorUser").get("id"), userId));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action.toUpperCase(Locale.ROOT)));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        }).stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void log(String action, String entityType, Integer entityId, String details) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String actorEmail = null;
        User actorUser = null;
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            actorEmail = authentication.getName();
            actorUser = userRepository.findByEmail(actorEmail).orElse(null);
        }

        AuditLog entry = new AuditLog();
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setActorEmail(actorEmail);
        entry.setActorUser(actorUser);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getActorEmail(),
                auditLog.getActorUser() == null ? null : auditLog.getActorUser().getId(),
                auditLog.getDetails(),
                auditLog.getCreatedAt()
        );
    }
}
