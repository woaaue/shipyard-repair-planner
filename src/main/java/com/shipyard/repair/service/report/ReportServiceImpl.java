package com.shipyard.repair.service.report;

import com.shipyard.repair.entity.Repair;
import com.shipyard.repair.entity.Ship;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.enums.UserRole;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.exception.ResourceNotFoundException;
import com.shipyard.repair.repository.DockRepository;
import com.shipyard.repair.repository.RepairRepository;
import com.shipyard.repair.repository.ShipRepository;
import com.shipyard.repair.repository.UserRepository;
import com.shipyard.repair.service.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private static final String XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final UserRepository userRepository;
    private final RepairRepository repairRepository;
    private final ShipRepository shipRepository;
    private final DockRepository dockRepository;
    private final AuditLogService auditLogService;

    @Override
    public ReportSummary getReportSummary(
            String principalEmail,
            ReportType type,
            ReportPeriod period,
            ReportScope scope,
            Integer scopeUserId,
            String fromDate,
            String toDate
    ) {
        User currentUser = resolveCurrentUser(principalEmail);
        validateScopeAccess(currentUser, scope);

        LocalDateTime fromBoundary = resolveFromBoundary(period, fromDate);
        LocalDateTime toBoundary = resolveToBoundary(toDate);
        if (toBoundary != null && fromBoundary.isAfter(toBoundary)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        if (type != ReportType.REPAIRS) {
            return new ReportSummary(0, 0, 0, 0);
        }

        List<Repair> repairs = filterRepairsByScope(currentUser, scope, scopeUserId, fromBoundary, toBoundary);
        long inProgress = repairs.stream()
                .filter(repair -> switch (repair.getStatus()) {
                    case STARTED, IN_PROGRESS, QA -> true;
                    default -> false;
                })
                .count();
        long completed = repairs.stream()
                .filter(repair -> repair.getStatus().name().equals("COMPLETED"))
                .count();
        long planned = repairs.stream()
                .filter(repair -> repair.getStatus().name().equals("SCHEDULED"))
                .count();

        return new ReportSummary(repairs.size(), inProgress, completed, planned);
    }

    @Override
    @Transactional(readOnly = false)
    public ReportFile exportReport(
            String principalEmail,
            ReportType type,
            ReportPeriod period,
            ReportScope scope,
            Integer scopeUserId,
            String fromDate,
            String toDate,
            String format
    ) {
        if (principalEmail == null || principalEmail.isBlank()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        if (!"xlsx".equalsIgnoreCase(format)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        User currentUser = resolveCurrentUser(principalEmail);

        validateScopeAccess(currentUser, scope);
        LocalDateTime fromBoundary = resolveFromBoundary(period, fromDate);
        LocalDateTime toBoundary = resolveToBoundary(toDate);
        if (toBoundary != null && fromBoundary.isAfter(toBoundary)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }

        ReportFile reportFile = switch (type) {
            case REPAIRS -> {
                List<Repair> scopedRepairs = filterRepairsByScope(currentUser, scope, scopeUserId, fromBoundary, toBoundary);
                yield new ReportFile(
                        buildRepairsWorkbook(scopedRepairs, currentUser, period, scope),
                        "report-repairs-" + period.name().toLowerCase(Locale.ROOT) + ".xlsx",
                        XLSX_CONTENT_TYPE
                );
            }
            case SHIPS -> {
                List<Ship> scopedShips = filterShipsByScope(currentUser, scope, scopeUserId);
                yield new ReportFile(
                        buildShipsWorkbook(scopedShips, currentUser, period, scope),
                        "report-ships-" + period.name().toLowerCase(Locale.ROOT) + ".xlsx",
                        XLSX_CONTENT_TYPE
                );
            }
            case DOCKS -> {
                List<DockSnapshot> scopedDocks = buildDockSnapshots(currentUser, scope, scopeUserId, fromBoundary, toBoundary);
                yield new ReportFile(
                        buildDocksWorkbook(scopedDocks, currentUser, period, scope),
                        "report-docks-" + period.name().toLowerCase(Locale.ROOT) + ".xlsx",
                        XLSX_CONTENT_TYPE
                );
            }
        };

        auditLogService.log(
                "REPORT_EXPORT",
                "REPORT",
                null,
                "type=" + type.name() + ",period=" + period.name() + ",scope=" + scope.name()
                        + ",scopeUserId=" + (scopeUserId == null ? "-" : scopeUserId)
                        + ",fromDate=" + (fromDate == null ? "-" : fromDate)
                        + ",toDate=" + (toDate == null ? "-" : toDate)
        );

        return reportFile;
    }

    private List<Repair> filterRepairsByScope(
            User currentUser,
            ReportScope scope,
            Integer scopeUserId,
            LocalDateTime fromBoundary,
            LocalDateTime toBoundary
    ) {
        Set<Integer> allowedOperatorIds = resolveAllowedOperatorIds(currentUser, scope, scopeUserId);
        boolean filterByClient = currentUser.getRole() == UserRole.CLIENT && scope == ReportScope.SELF;
        Integer dockId = scope == ReportScope.DOCK && currentUser.getDock() != null ? currentUser.getDock().getId() : null;

        return repairRepository.findAll().stream()
                .filter(repair -> repair.getCreatedAt() != null && !repair.getCreatedAt().isBefore(fromBoundary))
                .filter(repair -> toBoundary == null || !repair.getCreatedAt().isAfter(toBoundary))
                .filter(repair -> dockId == null || repair.getDock().getId() == dockId)
                .filter(repair -> !filterByClient || repair.getRepairRequest().getClient().getId() == currentUser.getId())
                .filter(repair -> allowedOperatorIds == null || (repair.getOperator() != null && allowedOperatorIds.contains(repair.getOperator().getId())))
                .toList();
    }

    private User resolveCurrentUser(String principalEmail) {
        if (principalEmail == null || principalEmail.isBlank()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        return userRepository.findByEmail(principalEmail)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
    }

    private List<Ship> filterShipsByScope(User currentUser, ReportScope scope, Integer scopeUserId) {
        List<Ship> allShips = shipRepository.findAll();
        Set<Integer> allowedDockIds = resolveAllowedDockIds(currentUser, scope);

        return allShips.stream()
                .filter(ship -> {
                    if (currentUser.getRole() == UserRole.CLIENT && scope == ReportScope.SELF) {
                        return ship.getUser().getId() == currentUser.getId();
                    }
                    return true;
                })
                .filter(ship -> allowedDockIds == null || (ship.getDock() != null && allowedDockIds.contains(ship.getDock().getId())))
                .filter(ship -> scopeUserId == null || ship.getUser().getId() == scopeUserId)
                .toList();
    }

    private List<DockSnapshot> buildDockSnapshots(
            User currentUser,
            ReportScope scope,
            Integer scopeUserId,
            LocalDateTime fromBoundary,
            LocalDateTime toBoundary
    ) {
        Set<Integer> allowedDockIds = resolveAllowedDockIds(currentUser, scope);
        Map<Integer, List<Repair>> repairsByDock = repairRepository.findAll().stream()
                .filter(repair -> repair.getCreatedAt() != null && !repair.getCreatedAt().isBefore(fromBoundary))
                .filter(repair -> toBoundary == null || !repair.getCreatedAt().isAfter(toBoundary))
                .collect(Collectors.groupingBy(repair -> repair.getDock().getId()));

        return dockRepository.findAll().stream()
                .filter(dock -> allowedDockIds == null || allowedDockIds.contains(dock.getId()))
                .map(dock -> {
                    List<Repair> dockRepairs = repairsByDock.getOrDefault(dock.getId(), List.of());
                    if (scopeUserId != null && dockRepairs.stream().noneMatch(r -> r.getOperator() != null && r.getOperator().getId() == scopeUserId)) {
                        return null;
                    }
                    long inProgress = dockRepairs.stream()
                            .filter(r -> switch (r.getStatus()) {
                                case STARTED, IN_PROGRESS, QA -> true;
                                default -> false;
                            })
                            .count();
                    long completed = dockRepairs.stream().filter(r -> r.getStatus().name().equals("COMPLETED")).count();
                    return new DockSnapshot(dock.getId(), dock.getName(), dock.getStatus().name(), dockRepairs.size(), inProgress, completed);
                })
                .filter(snapshot -> snapshot != null)
                .toList();
    }

    private Set<Integer> resolveAllowedOperatorIds(User currentUser, ReportScope scope, Integer scopeUserId) {
        if (scope == ReportScope.SYSTEM && currentUser.getRole() == UserRole.ADMIN) {
            return null;
        }
        return switch (scope) {
            case SELF -> resolveSelfOperatorIds(currentUser);
            case DOCK -> null;
            case TEAM, SUBORDINATES -> {
                Set<Integer> descendants = collectDescendantIds(currentUser.getId());
                Set<Integer> operatorIds = descendants.stream()
                        .map(id -> userRepository.findById(id).orElse(null))
                        .filter(user -> user != null && user.getRole() == UserRole.OPERATOR)
                        .map(User::getId)
                        .collect(Collectors.toSet());
                if (currentUser.getRole() == UserRole.OPERATOR) {
                    operatorIds.add(currentUser.getId());
                }
                if (scopeUserId != null) {
                    if (!operatorIds.contains(scopeUserId)) {
                        throw new BadRequestException(ErrorCode.BAD_REQUEST);
                    }
                    yield Set.of(scopeUserId);
                }
                yield operatorIds;
            }
            case SYSTEM -> throw new BadRequestException(ErrorCode.BAD_REQUEST);
        };
    }

    private Set<Integer> resolveAllowedDockIds(User currentUser, ReportScope scope) {
        if (currentUser.getRole() == UserRole.ADMIN && scope == ReportScope.SYSTEM) {
            return null;
        }
        if (scope == ReportScope.DOCK && currentUser.getDock() != null) {
            return Set.of(currentUser.getDock().getId());
        }
        if (currentUser.getRole() == UserRole.CLIENT && scope == ReportScope.SELF) {
            return null;
        }
        if (scope == ReportScope.SUBORDINATES || scope == ReportScope.TEAM || currentUser.getRole() == UserRole.DISPATCHER) {
            Set<Integer> dockIds = new HashSet<>();
            for (Integer userId : collectDescendantIds(currentUser.getId())) {
                User subordinate = userRepository.findById(userId).orElse(null);
                if (subordinate != null && subordinate.getDock() != null) {
                    dockIds.add(subordinate.getDock().getId());
                }
            }
            if (currentUser.getDock() != null) {
                dockIds.add(currentUser.getDock().getId());
            }
            return dockIds;
        }
        if (currentUser.getRole() == UserRole.OPERATOR && currentUser.getDock() != null) {
            return Set.of(currentUser.getDock().getId());
        }
        return Set.of();
    }

    private Set<Integer> resolveSelfOperatorIds(User currentUser) {
        if (currentUser.getRole() == UserRole.OPERATOR) {
            return Set.of(currentUser.getId());
        }
        if (currentUser.getRole() == UserRole.DISPATCHER) {
            return collectOperatorIds(collectDescendantIds(currentUser.getId()));
        }
        if (currentUser.getRole() == UserRole.CLIENT) {
            return null;
        }
        if (currentUser.getRole() == UserRole.ADMIN) {
            return null;
        }
        return Set.of();
    }

    private Set<Integer> collectOperatorIds(Set<Integer> userIds) {
        Set<Integer> operatorIds = new HashSet<>();
        for (Integer userId : userIds) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getRole() == UserRole.OPERATOR) {
                operatorIds.add(user.getId());
            }
        }
        return operatorIds;
    }

    private Set<Integer> collectDescendantIds(int rootUserId) {
        Set<Integer> descendants = new HashSet<>();
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        queue.add(rootUserId);

        while (!queue.isEmpty()) {
            int parentId = queue.removeFirst();
            List<User> children = userRepository.findByReportsToId(parentId);
            for (User child : children) {
                if (descendants.add(child.getId())) {
                    queue.addLast(child.getId());
                }
            }
        }
        return descendants;
    }

    private LocalDateTime resolvePeriodStart(ReportPeriod period) {
        LocalDate now = LocalDate.now();
        return switch (period) {
            case WEEK -> now.minusDays(7).atStartOfDay();
            case MONTH -> now.minusMonths(1).atStartOfDay();
            case QUARTER -> now.minusMonths(3).atStartOfDay();
            case YEAR -> now.minusYears(1).atStartOfDay();
        };
    }

    private LocalDateTime resolveFromBoundary(ReportPeriod period, String fromDate) {
        if (fromDate == null || fromDate.isBlank()) {
            return resolvePeriodStart(period);
        }
        try {
            return LocalDate.parse(fromDate).atStartOfDay();
        } catch (DateTimeParseException exception) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
    }

    private LocalDateTime resolveToBoundary(String toDate) {
        if (toDate == null || toDate.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(toDate).atTime(23, 59, 59);
        } catch (DateTimeParseException exception) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
    }

    private void validateScopeAccess(User currentUser, ReportScope scope) {
        UserRole role = currentUser.getRole();
        if (scope == ReportScope.SYSTEM && role != UserRole.ADMIN) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        if (scope == ReportScope.SUBORDINATES && role != UserRole.DISPATCHER && role != UserRole.OPERATOR && role != UserRole.MASTER) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        if (scope == ReportScope.TEAM && role != UserRole.OPERATOR && role != UserRole.MASTER) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
        if (scope == ReportScope.DOCK && role != UserRole.OPERATOR && role != UserRole.DISPATCHER && role != UserRole.ADMIN) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST);
        }
    }

    private byte[] buildRepairsWorkbook(List<Repair> repairs, User currentUser, ReportPeriod period, ReportScope scope) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Repairs");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle bodyStyle = createBodyStyle(workbook);
            int rowIndex = 0;
            Row header = sheet.createRow(rowIndex++);
            String[] headers = {"ID", "Судно", "Док", "Оператор", "Статус", "Прогресс, %", "Факт. начало", "Факт. окончание", "Создано"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            for (Repair repair : repairs) {
                Row row = sheet.createRow(rowIndex++);
                setCell(row, 0, Integer.toString(repair.getId()), bodyStyle);
                setCell(row, 1, repair.getRepairRequest().getShip().getName(), bodyStyle);
                setCell(row, 2, repair.getDock().getName(), bodyStyle);
                setCell(row, 3, repair.getOperator() == null ? "" : fullName(repair.getOperator()), bodyStyle);
                setCell(row, 4, localizeRepairStatus(repair.getStatus().name()), bodyStyle);
                setCell(row, 5, Integer.toString(repair.getProgressPercentage()), bodyStyle);
                setCell(row, 6, repair.getActualStartDate() == null ? "" : repair.getActualStartDate().toString(), bodyStyle);
                setCell(row, 7, repair.getActualEndDate() == null ? "" : repair.getActualEndDate().toString(), bodyStyle);
                setCell(row, 8, repair.getCreatedAt() == null ? "" : repair.getCreatedAt().toString(), bodyStyle);
            }
            adjustColumnWidths(sheet, new int[] {8, 20, 16, 24, 14, 12, 14, 14, 20});
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate report file", exception);
        }
    }

    private byte[] buildShipsWorkbook(List<Ship> ships, User currentUser, ReportPeriod period, ReportScope scope) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ships");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle bodyStyle = createBodyStyle(workbook);
            int rowIndex = 0;
            Row header = sheet.createRow(rowIndex++);
            String[] headers = {"ID", "Название", "Рег. номер", "Тип", "Статус", "Владелец", "Док"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            for (Ship ship : ships) {
                Row row = sheet.createRow(rowIndex++);
                setCell(row, 0, Integer.toString(ship.getId()), bodyStyle);
                setCell(row, 1, ship.getName(), bodyStyle);
                setCell(row, 2, ship.getRegNumber(), bodyStyle);
                setCell(row, 3, localizeShipType(ship.getShipType().name()), bodyStyle);
                setCell(row, 4, localizeShipStatus(ship.getShipStatus().name()), bodyStyle);
                setCell(row, 5, fullName(ship.getUser()), bodyStyle);
                setCell(row, 6, ship.getDock() == null ? "" : ship.getDock().getName(), bodyStyle);
            }
            adjustColumnWidths(sheet, new int[] {8, 22, 18, 14, 14, 24, 16});
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate report file", exception);
        }
    }

    private byte[] buildDocksWorkbook(List<DockSnapshot> docks, User currentUser, ReportPeriod period, ReportScope scope) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Docks");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle bodyStyle = createBodyStyle(workbook);
            int rowIndex = 0;
            Row header = sheet.createRow(rowIndex++);
            String[] headers = {"ID дока", "Док", "Статус", "Ремонтов всего", "Ремонтов в работе", "Ремонтов завершено"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            for (DockSnapshot dock : docks) {
                Row row = sheet.createRow(rowIndex++);
                setCell(row, 0, Integer.toString(dock.dockId), bodyStyle);
                setCell(row, 1, dock.dockName, bodyStyle);
                setCell(row, 2, localizeDockStatus(dock.dockStatus), bodyStyle);
                setCell(row, 3, Long.toString(dock.repairsTotal), bodyStyle);
                setCell(row, 4, Long.toString(dock.repairsInProgress), bodyStyle);
                setCell(row, 5, Long.toString(dock.repairsCompleted), bodyStyle);
            }
            adjustColumnWidths(sheet, new int[] {10, 20, 14, 16, 22, 20});
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to generate report file", exception);
        }
    }

    private String fullName(User user) {
        String patronymic = user.getPatronymic() == null || user.getPatronymic().isBlank() ? "" : " " + user.getPatronymic();
        return (user.getLastName() + " " + user.getFirstName() + patronymic).trim();
    }

    private String localizeRepairStatus(String status) {
        return switch (status) {
            case "SCHEDULED" -> "Запланирован";
            case "STARTED", "IN_PROGRESS" -> "В работе";
            case "QA" -> "Контроль качества";
            case "COMPLETED" -> "Завершён";
            case "CANCELLED" -> "Отменён";
            default -> status;
        };
    }

    private String localizeShipType(String shipType) {
        return switch (shipType) {
            case "TANKER" -> "Танкер";
            case "BULK_CARRIER" -> "Балкер";
            case "CONTAINER_SHIP" -> "Контейнеровоз";
            case "RO_RO" -> "Ro-Ro";
            case "PASSENGER" -> "Пассажирское";
            case "FERRY" -> "Паром";
            case "TUG" -> "Буксир";
            case "FISHING" -> "Рыболовное";
            case "DREDGER" -> "Земснаряд";
            case "OTHER" -> "Другое";
            default -> shipType;
        };
    }

    private String localizeShipStatus(String shipStatus) {
        return switch (shipStatus) {
            case "IDLE" -> "Не задействовано";
            case "WAITING" -> "Ожидает";
            case "UNDER_REPAIR" -> "В ремонте";
            case "COMPLETED" -> "Завершено";
            default -> shipStatus;
        };
    }

    private String localizeDockStatus(String dockStatus) {
        return switch (dockStatus) {
            case "AVAILABLE" -> "Активен";
            case "OCCUPIED" -> "Занят";
            case "MAINTENANCE" -> "Неактивен";
            case "REPAIR" -> "В ремонте";
            default -> dockStatus;
        };
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);

        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle createBodyStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void adjustColumnWidths(Sheet sheet, int[] minCharWidths) {
        for (int i = 0; i < minCharWidths.length; i++) {
            sheet.autoSizeColumn(i);
            int min = minCharWidths[i] * 256;
            int current = sheet.getColumnWidth(i);
            sheet.setColumnWidth(i, Math.max(min, Math.min(current + 512, 60 * 256)));
        }
    }

    private static class DockSnapshot {
        private final int dockId;
        private final String dockName;
        private final String dockStatus;
        private final long repairsTotal;
        private final long repairsInProgress;
        private final long repairsCompleted;

        private DockSnapshot(int dockId, String dockName, String dockStatus, long repairsTotal, long repairsInProgress, long repairsCompleted) {
            this.dockId = dockId;
            this.dockName = dockName;
            this.dockStatus = dockStatus;
            this.repairsTotal = repairsTotal;
            this.repairsInProgress = repairsInProgress;
            this.repairsCompleted = repairsCompleted;
        }
    }
}
