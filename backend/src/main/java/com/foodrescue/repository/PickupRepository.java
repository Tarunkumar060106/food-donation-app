package com.foodrescue.repository;

import com.foodrescue.dto.PickupStatusCount;
import com.foodrescue.entity.Pickup;
import com.foodrescue.entity.PickupStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PickupRepository extends JpaRepository<Pickup, UUID> {

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector"})
    Optional<Pickup> findWithDetailsById(UUID id);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector"})
    Optional<Pickup> findFirstByDonationIdAndStatusIn(UUID donationId, Collection<PickupStatus> statuses);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector"})
    List<Pickup> findByDonationIdInAndStatusIn(Collection<UUID> donationIds, Collection<PickupStatus> statuses);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector"})
    List<Pickup> findByCollectorIdOrderByClaimedAtDesc(UUID collectorId);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector"})
    List<Pickup> findByDonationDonorIdOrderByClaimedAtDesc(UUID donorId);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector"})
    List<Pickup> findByStatusInOrderByClaimedAtDesc(Collection<PickupStatus> statuses);

    @Query("""
            select new com.foodrescue.dto.PickupStatusCount(p.status, count(p), coalesce(sum(p.donation.servings), 0L))
              from Pickup p
             where p.collector.id = :collectorId
             group by p.status
            """)
    List<PickupStatusCount> countByStatusForCollector(@Param("collectorId") UUID collectorId);

    long countByStatusIn(Collection<PickupStatus> statuses);
}
