/**
 * Formats GPS accuracy value consistently across the app
 * @param accuracy - GPS accuracy in meters
 * @returns Formatted string with appropriate unit
 */
export const formatGpsAccuracy = (accuracy: number | null | undefined): string => {
  if (!accuracy) return "Okänd";
  
  const roundedAccuracy = Math.round(accuracy);
  
  if (roundedAccuracy < 1000) {
    return `±${roundedAccuracy} meter`;
  } else {
    return `±${(roundedAccuracy / 1000).toFixed(1)} km`;
  }
};

/**
 * Gets an icon based on GPS accuracy
 * @param accuracy - GPS accuracy in meters
 * @returns Emoji icon representing accuracy level
 */
export const getGpsAccuracyIcon = (accuracy: number | null | undefined): string => {
  if (!accuracy) return "📌";
  
  if (accuracy < 50) return "🎯";
  if (accuracy < 500) return "📍";
  return "📌";
};
