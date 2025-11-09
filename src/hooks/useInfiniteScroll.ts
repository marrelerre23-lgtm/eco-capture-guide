import { useState, useEffect } from "react";

export const useInfiniteScroll = <T,>(items: T[], itemsPerPage: number = 10) => {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Reset when items change
    setPage(1);
    setDisplayedItems(items.slice(0, itemsPerPage));
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  const loadMore = () => {
    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * itemsPerPage;
    const newDisplayedItems = items.slice(startIndex, endIndex);
    
    setDisplayedItems(newDisplayedItems);
    setPage(nextPage);
    setHasMore(endIndex < items.length);
  };

  return {
    displayedItems,
    loadMore,
    hasMore,
    totalItems: items.length,
  };
};
