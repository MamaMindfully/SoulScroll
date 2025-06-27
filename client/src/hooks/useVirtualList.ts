import { useState, useEffect, useMemo, useCallback } from 'react';
import { calculateVisibleItems } from '@/utils/performanceOptimizations';

interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  items: any[];
}

export const useVirtualList = ({
  itemHeight,
  containerHeight,
  overscan = 5,
  items
}: UseVirtualListOptions) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    return calculateVisibleItems(containerHeight, itemHeight, scrollTop, overscan);
  }, [containerHeight, itemHeight, scrollTop, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    containerProps: {
      style: {
        height: containerHeight,
        overflow: 'auto'
      },
      onScroll: handleScroll
    },
    innerProps: {
      style: {
        height: totalHeight,
        position: 'relative' as const
      }
    }
  };
};