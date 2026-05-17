package com.shipyard.repair.service.user;

import com.shipyard.repair.dto.dataquality.DataQualityResponse;
import com.shipyard.repair.entity.Dock;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataQualityServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DataQualityServiceImpl dataQualityService;

    @Test
    void getDataQualityReport_calculatesUserQualityIssues() {
        Dock dock1 = dock(1, "Док-1");

        User dispatcher = user(10, "dispatcher@shipyard.com", "Ирина", "Диспетчер", UserRole.DISPATCHER, null, null);
        User operatorValid = user(11, "operator@shipyard.com", "Олег", "Оператор", UserRole.OPERATOR, dock1, dispatcher);
        User masterValid = user(12, "master@shipyard.com", "Марат", "Мастер", UserRole.MASTER, dock1, operatorValid);
        User workerValid = user(13, "worker@shipyard.com", "Иван", "Рабочий", UserRole.WORKER, dock1, masterValid);

        User operatorWithoutSupervisor = user(14, "operator2@shipyard.com", "Антон", "Оператор", UserRole.OPERATOR, dock1, null);
        User workerWithoutDock = user(15, "worker2@shipyard.com", "Павел", "Рабочий", UserRole.WORKER, null, masterValid);
        User workerInvalidHierarchy = user(16, "worker3@shipyard.com", "Сергей", "Рабочий", UserRole.WORKER, dock1, operatorValid);

        User duplicateEmail1 = user(17, "dup@mail.com", "Клиент", "Один", UserRole.CLIENT, null, null);
        User duplicateEmail2 = user(18, "DUP@mail.com", "Клиент", "Два", UserRole.CLIENT, null, null);

        when(userRepository.findAll()).thenReturn(List.of(
                dispatcher,
                operatorValid,
                masterValid,
                workerValid,
                operatorWithoutSupervisor,
                workerWithoutDock,
                workerInvalidHierarchy,
                duplicateEmail1,
                duplicateEmail2
        ));

        DataQualityResponse result = dataQualityService.getDataQualityReport();

        assertEquals(1, result.withoutSupervisorCount());
        assertEquals(1, result.withoutDockCount());
        assertEquals(1, result.invalidHierarchyCount());
        assertEquals(1, result.duplicateEmailGroupsCount());

        assertTrue(result.withoutSupervisorUsers().stream().anyMatch(item -> item.userId().equals(14)));
        assertTrue(result.withoutDockUsers().stream().anyMatch(item -> item.userId().equals(15)));
        assertTrue(result.invalidHierarchyUsers().stream().anyMatch(item -> item.userId().equals(16)));

        assertEquals("dup@mail.com", result.duplicateEmailGroups().get(0).email());
        assertEquals(2, result.duplicateEmailGroups().get(0).usersCount());
    }

    @Test
    void getDataQualityReport_doesNotMarkMissingSupervisorAsHierarchyViolation() {
        User workerWithoutSupervisor = user(25, "worker25@shipyard.com", "Иван", "БезРук", UserRole.WORKER, null, null);

        when(userRepository.findAll()).thenReturn(List.of(workerWithoutSupervisor));

        DataQualityResponse result = dataQualityService.getDataQualityReport();

        assertEquals(1, result.withoutSupervisorCount());
        assertEquals(0, result.invalidHierarchyCount());
    }

    private static Dock dock(int id, String name) {
        Dock dock = new Dock();
        dock.setId(id);
        dock.setName(name);
        return dock;
    }

    private static User user(
            int id,
            String email,
            String firstName,
            String lastName,
            UserRole role,
            Dock dock,
            User reportsTo
    ) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setDock(dock);
        user.setReportsTo(reportsTo);
        user.setEnabled(true);
        return user;
    }
}

