package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.dataquality.DataQualityResponse;
import com.shipyard.repair.dto.dataquality.DataQualityUserIssueResponse;
import com.shipyard.repair.dto.dataquality.DuplicateEmailGroupResponse;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DataQualityServiceImpl implements DataQualityService {

    private static final Set<UserRole> NEEDS_SUPERVISOR = Set.of(UserRole.WORKER, UserRole.MASTER, UserRole.OPERATOR);
    private static final Set<UserRole> NEEDS_DOCK = Set.of(UserRole.WORKER, UserRole.MASTER, UserRole.OPERATOR);

    private final UserRepository userRepository;

    @Override
    public DataQualityResponse getDataQualityReport() {
        List<User> users = userRepository.findAll();

        List<DataQualityUserIssueResponse> withoutSupervisorUsers = users.stream()
                .filter(user -> NEEDS_SUPERVISOR.contains(user.getRole()) && user.getReportsTo() == null)
                .map(user -> toIssue(user, expectedSupervisorRole(user.getRole()), null))
                .toList();

        List<DataQualityUserIssueResponse> withoutDockUsers = users.stream()
                .filter(user -> NEEDS_DOCK.contains(user.getRole()) && user.getDock() == null)
                .map(user -> toIssue(user, null, null))
                .toList();

        List<DataQualityUserIssueResponse> invalidHierarchyUsers = users.stream()
                .filter(user -> isInvalidHierarchy(user))
                .map(user -> {
                    String expected = expectedSupervisorRole(user.getRole());
                    String actual = user.getReportsTo() == null ? null : normalizeRole(user.getReportsTo().getRole());
                    return toIssue(user, expected, actual);
                })
                .toList();

        Map<String, List<User>> usersByEmail = users.stream()
                .collect(Collectors.groupingBy(user -> user.getEmail().toLowerCase(Locale.ROOT)));

        List<DuplicateEmailGroupResponse> duplicateEmailGroups = usersByEmail.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new DuplicateEmailGroupResponse(
                        entry.getKey(),
                        entry.getValue().size(),
                        entry.getValue().stream().map(user -> toIssue(user, null, null)).toList()
                ))
                .toList();

        return new DataQualityResponse(
                withoutSupervisorUsers.size(),
                withoutDockUsers.size(),
                invalidHierarchyUsers.size(),
                duplicateEmailGroups.size(),
                withoutSupervisorUsers,
                withoutDockUsers,
                invalidHierarchyUsers,
                duplicateEmailGroups,
                LocalDateTime.now()
        );
    }

    private boolean isInvalidHierarchy(User user) {
        if (!NEEDS_SUPERVISOR.contains(user.getRole())) {
            return false;
        }
        UserRole expected = expectedSupervisorRoleEnum(user.getRole());
        if (expected == null) {
            return false;
        }
        User supervisor = user.getReportsTo();
        return supervisor != null && supervisor.getRole() != expected;
    }

    private UserRole expectedSupervisorRoleEnum(UserRole role) {
        return switch (role) {
            case WORKER -> UserRole.MASTER;
            case MASTER -> UserRole.OPERATOR;
            case OPERATOR -> UserRole.DISPATCHER;
            case CLIENT, DISPATCHER, ADMIN -> null;
        };
    }

    private String expectedSupervisorRole(UserRole role) {
        UserRole expectedRole = expectedSupervisorRoleEnum(role);
        return expectedRole == null ? null : normalizeRole(expectedRole);
    }

    private DataQualityUserIssueResponse toIssue(User user, String expectedSupervisorRole, String actualSupervisorRole) {
        User supervisor = user.getReportsTo();
        return new DataQualityUserIssueResponse(
                user.getId(),
                buildFullName(user),
                user.getEmail(),
                normalizeRole(user.getRole()),
                user.getDock() == null ? null : user.getDock().getName(),
                supervisor == null ? null : supervisor.getId(),
                supervisor == null ? null : buildFullName(supervisor),
                expectedSupervisorRole,
                actualSupervisorRole
        );
    }

    private String buildFullName(User user) {
        return String.join(" ",
                user.getLastName(),
                user.getFirstName(),
                user.getPatronymic() == null ? "" : user.getPatronymic()
        ).trim();
    }

    private String normalizeRole(UserRole role) {
        return role.name();
    }
}

