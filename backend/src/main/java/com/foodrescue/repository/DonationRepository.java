package com.foodrescue.repository;

import com.foodrescue.dto.StatusCount;
import com.foodrescue.entity.Donation;
import com.foodrescue.entity.DonationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface DonationRepository extends JpaRepository<Donation, UUID> {

    @EntityGraph(attributePaths = "donor")
    List<Donation> findByStatusIn(Collection<DonationStatus> statuses);

    @EntityGraph(attributePaths = "donor")
    List<Donation> findByDonorIdOrderByCreatedAtDesc(UUID donorId);

    @EntityGraph(attributePaths = "donor")
    List<Donation> findAllByOrderByCreatedAtDesc();

    /**
     * Claims atomically: the row only changes if it is still available and in time,
     * so two concurrent claims can never both succeed.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Donation d
               set d.status = com.foodrescue.entity.DonationStatus.CLAIMED,
                   d.version = d.version + 1,
                   d.updatedAt = :now
             where d.id = :id
               and d.status = com.foodrescue.entity.DonationStatus.AVAILABLE
               and d.expiryTime > :now
               and d.pickupDeadline > :now
            """)
    int claimIfAvailable(@Param("id") UUID id, @Param("now") Instant now);

    @Query("""
            select d from Donation d
             where d.expiryTime <= :now
               and d.status in (com.foodrescue.entity.DonationStatus.AVAILABLE,
                                com.foodrescue.entity.DonationStatus.CLAIMED)
            """)
    List<Donation> findExpiredButOpen(@Param("now") Instant now);

    @Query("""
            select new com.foodrescue.dto.StatusCount(d.status, count(d), coalesce(sum(d.servings), 0L))
              from Donation d
             group by d.status
            """)
    List<StatusCount> countByStatus();

    @Query("""
            select new com.foodrescue.dto.StatusCount(d.status, count(d), coalesce(sum(d.servings), 0L))
              from Donation d
             where d.donor.id = :donorId
             group by d.status
            """)
    List<StatusCount> countByStatusForDonor(@Param("donorId") UUID donorId);
}
