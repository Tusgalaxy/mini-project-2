import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = width >= 768;
  const columns = width >= 768 ? 3 : width >= 480 ? 2 : 1;
  const cardWidth = width >= 768 ? (width - 48) / 3 : width >= 480 ? (width - 32) / 2 : width - 32;

  return { isLandscape, isTablet, columns, cardWidth };
}