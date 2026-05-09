package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.ReliefItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReliefItemRepository extends JpaRepository<ReliefItem, Long> {

    List<ReliefItem> findByCategory(String category);

    List<ReliefItem> findByQuantityInStockLessThanEqual(Integer threshold);
}
