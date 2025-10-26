// Color palette for subjects with optimal text contrast
export const SUBJECT_COLORS = [
  "bg-red-500 text-white",      // AA Large rating with white
  "bg-yellow-500 text-black",   // Fails with white, good with black
  "bg-lime-500 text-black",     // Fails with white, good with black
  "bg-teal-500 text-black",     // Fails with white, good with black
  "bg-blue-500 text-white",     // AA Large rating with white
  "bg-indigo-500 text-white",   // AA Large rating with white
  "bg-fuchsia-500 text-white",  // AA Large rating with white
  "bg-slate-500 text-white",    // AA rating with white
] as const;


export type SubjectColor = (typeof SUBJECT_COLORS)[number];

/**
 * Get the next available color from the palette
 * @param usedColors Array of colors already in use
 * @returns Next available color or first color if all are used
 */
export function getNextAvailableColor(usedColors: string[] = []): SubjectColor {
  for (const color of SUBJECT_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  // If all colors are used, return the first one
  return SUBJECT_COLORS[0];
}

/**
 * Get color by index (for consistent assignment)
 * @param index Index in the palette
 * @returns Color at index or first color if index is out of bounds
 */
export function getColorByIndex(index: number): SubjectColor {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

/**
 * Parse color string to get just the background class
 * @param colorString Full color string like "bg-chart-1 text-white"
 * @returns Background class like "bg-chart-1"
 */
export function getBackgroundClass(colorString: string): string {
  return colorString.split(" ")[0];
}

/**
 * Parse color string to get just the text class
 * @param colorString Full color string like "bg-chart-1 text-white"
 * @returns Text class like "text-white"
 */
export function getTextClass(colorString: string): string {
  return colorString.split(" ")[1] || "text-white";
}
