/**
 * Responsive Design Utilities
 * Handle layout adjustments for different screen sizes
 */

import { useWindowDimensions } from 'react-native';

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveValues {
  xs: number | string;
  sm: number | string;
  md: number | string;
  lg: number | string;
  xl: number | string;
}

/**
 * Screen size breakpoints (in pixels)
 * Based on common device widths
 */
export const BREAKPOINTS = {
  xs: 320, // iPhone SE
  sm: 375, // iPhone 12/13
  md: 428, // iPhone 14 Pro Max
  lg: 768, // iPad Mini
  xl: 1024, // iPad Pro
};

/**
 * Hook to get current screen size
 */
export function useScreenSize(): ScreenSize {
  const { width } = useWindowDimensions();

  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  return 'xl';
}

/**
 * Hook to get current orientation
 */
export function useOrientation(): Orientation {
  const { width, height } = useWindowDimensions();
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Get responsive value based on screen size
 */
export function getResponsiveValue(
  values: ResponsiveValues,
  screenSize: ScreenSize
): number | string {
  return values[screenSize];
}

/**
 * Hook to get responsive value
 */
export function useResponsiveValue(values: ResponsiveValues): number | string {
  const screenSize = useScreenSize();
  return getResponsiveValue(values, screenSize);
}

/**
 * Common responsive spacing values
 */
export const RESPONSIVE_SPACING = {
  xs: { xs: 12, sm: 12, md: 16, lg: 20, xl: 24 },
  sm: { xs: 16, sm: 16, md: 20, lg: 24, xl: 28 },
  md: { xs: 20, sm: 20, md: 24, lg: 28, xl: 32 },
  lg: { xs: 24, sm: 24, md: 28, lg: 32, xl: 36 },
  xl: { xs: 32, sm: 32, md: 36, lg: 40, xl: 48 },
};

/**
 * Common responsive font sizes
 */
export const RESPONSIVE_FONT_SIZE = {
  xs: { xs: 12, sm: 12, md: 13, lg: 14, xl: 14 },
  sm: { xs: 14, sm: 14, md: 15, lg: 16, xl: 16 },
  md: { xs: 16, sm: 16, md: 17, lg: 18, xl: 18 },
  lg: { xs: 18, sm: 18, md: 20, lg: 22, xl: 24 },
  xl: { xs: 24, sm: 24, md: 28, lg: 32, xl: 36 },
};

/**
 * Common responsive image heights
 */
export const RESPONSIVE_IMAGE_HEIGHT = {
  small: { xs: 120, sm: 140, md: 160, lg: 200, xl: 240 },
  medium: { xs: 160, sm: 180, md: 200, lg: 240, xl: 280 },
  large: { xs: 200, sm: 220, md: 240, lg: 280, xl: 320 },
};

/**
 * Common responsive grid columns
 */
export const RESPONSIVE_COLUMNS = {
  xs: 1,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};

/**
 * Get number of columns based on screen size
 */
export function getResponsiveColumns(screenSize: ScreenSize): number {
  return RESPONSIVE_COLUMNS[screenSize];
}

/**
 * Hook to get responsive columns
 */
export function useResponsiveColumns(): number {
  const screenSize = useScreenSize();
  return getResponsiveColumns(screenSize);
}
