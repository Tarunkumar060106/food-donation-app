package com.foodrescue.repository;

import com.foodrescue.dto.DonationCount;
import com.foodrescue.entity.MatchRequest;
import com.foodrescue.entity.MatchRequestStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, UUID> {

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector", "collector.organization", "pickup"})
    Optional<MatchRequest> findWithDetailsById(UUID id);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector", "collector.organization", "pickup"})
    List<MatchRequest> findByDonationIdAndStatus(UUID donationId, MatchRequestStatus status);

    Optional<MatchRequest> findByDonationIdAndCollectorIdAndStatus(UUID donationId, UUID collectorId, MatchRequestStatus status);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector", "collector.organization", "pickup"})
    List<MatchRequest> findByCollectorIdOrderByCreatedAtDesc(UUID collectorId);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector", "collector.organization", "pickup"})
    List<MatchRequest> findByDonationDonorIdOrderByCreatedAtDesc(UUID donorId);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector", "collector.organization", "pickup"})
    List<MatchRequest> findByDonationIdOrderByCreatedAtDesc(UUID donationId);

    @EntityGraph(attributePaths = {"donation", "donation.donor", "collector", "collector.organization", "pickup"})
    List<MatchRequest> findTop200ByOrderByCreatedAtDesc();

    /** The collector's requests and offers for a set of donations, newest first, for the feed badges. */
    List<MatchRequest> findByCollectorIdAndDonationIdInOrderByCreatedAtDesc(UUID collectorId, Collection<UUID> donationIds);

    /** Collector requests still waiting for this donor, per donation. */
    @Query("""
            select new com.foodrescue.dto.DonationCount(m.donation.id, count(m))
              from MatchRequest m
             where m.donation.donor.id = :donorId
               and m.status = com.foodrescue.entity.MatchRequestStatus.PENDING
               and m.direction = com.foodrescue.entity.MatchDirection.REQUEST
             group by m.donation.id
            """)
    List<DonationCount> countPendingRequestsForDonor(@Param("donorId") UUID donorId);

    long countByStatus(MatchRequestStatus status);

    /** Closes whatever is still pending once the food is cancelled or expires. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update MatchRequest m
               set m.status = com.foodrescue.entity.MatchRequestStatus.CLOSED,
                   m.respondedAt = :now,
                   m.version = m.version + 1
             where m.donation.id = :donationId
               and m.status = com.foodrescue.entity.MatchRequestStatus.PENDING
            """)
    int closePending(@Param("donationId") UUID donationId, @Param("now") Instant now);
}
