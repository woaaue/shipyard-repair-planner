package com.shipyard.repair.repository;

import com.shipyard.repair.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    @Query("""
            select n
            from Notification n
            where (n.user is null or n.user.id = :userId)
              and (:unreadOnly = false or n.read = false)
            order by n.createdAt desc
            """)
    List<Notification> findVisibleForUser(@Param("userId") Integer userId, @Param("unreadOnly") boolean unreadOnly);

    @Query("""
            select n
            from Notification n
            where n.id = :id
              and (n.user is null or n.user.id = :userId)
            """)
    Optional<Notification> findVisibleById(@Param("id") Integer id, @Param("userId") Integer userId);
}
