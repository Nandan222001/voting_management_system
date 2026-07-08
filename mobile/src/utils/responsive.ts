import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard base dimensions (iPhone X/11/12/13/14/15/Pro base)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Horizontal Scale: For widths, paddingHorizontal, marginHorizontal, etc.
 */
export const hs = (size: number) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;

/**
 * Vertical Scale: For heights, paddingVertical, marginVertical, etc.
 */
export const vs = (size: number) => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Moderate Scale: For font sizes, border radius, and icons.
 * The 'factor' allows you to control how much the size should scale.
 */
export const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

/**
 * Width Percentage: Returns width based on percentage of screen width.
 */
export const wp = (widthPercent: number | string) => {
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Height Percentage: Returns height based on percentage of screen height.
 */
export const hp = (heightPercent: number | string) => {
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Screen dimensions for absolute positioning or other cases
 */
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};
