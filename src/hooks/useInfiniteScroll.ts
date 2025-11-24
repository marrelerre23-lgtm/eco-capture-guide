import { useState, useEffect } from "react";

// #11: Responsive page size - more items on desktop
const getItemsPerPage = () => {
  if (typeof window === 'undefined') return 10;
  return window.innerWidth >= 768 ? 15 : 10; // 15 on desktop, 10 on mobile
};

export const useInfiniteScroll = <T,>(items: T[], itemsPerPage?: number) => {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const effectiveItemsPerPage = itemsPerPage || getItemsPerPage();

  useEffect(() => {
    // Reset when items change
    setPage(1);
    setDisplayedItems(items.slice(0, effectiveItemsPerPage));
    setHasMore(items.length > effectiveItemsPerPage);
  }, [items, effectiveItemsPerPage]);

  const loadMore = () => {
    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * effectiveItemsPerPage;
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
