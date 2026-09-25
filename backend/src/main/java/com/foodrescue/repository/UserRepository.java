package com.foodrescue.repository;

import com.foodrescue.entity.Role;
import com.foodrescue.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "organization")
    List<User> findByRoleInAndLatitudeIsNotNullAndLongitudeIsNotNull(Collection<Role> roles);

    @EntityGraph(attributePaths = "organization")
    List<User> findAllByOrderByCreatedAtDesc();
}
