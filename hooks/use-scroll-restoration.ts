import { useEffect, useCallback, RefObject } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const scrollPositions: Record<string, number> = {};

export function useScrollRestoration(
  scrollRef: RefObject<ScrollView>,
  routeKey: string
) {
  useEffect(() => {
    if (scrollPositions[routeKey] !== undefined) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          y: scrollPositions[routeKey],
          animated: false,
        });
      });
    }
  }, [routeKey, scrollRef]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositions[routeKey] = e.nativeEvent.contentOffset.y;
    },
    [routeKey]
  );

  return handleScroll;
}
