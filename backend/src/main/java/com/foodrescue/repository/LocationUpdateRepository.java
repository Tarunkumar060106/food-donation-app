package com.foodrescue.repository;

import com.foodrescue.entity.LocationUpdate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LocationUpdateRepository extends JpaRepository<LocationUpdate, Long> {

    List<LocationUpdate> findTop100ByPickupIdOrderByRecordedAtDesc(UUID pickupId);
}
