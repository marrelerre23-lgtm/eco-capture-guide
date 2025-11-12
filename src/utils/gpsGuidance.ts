/**
 * Get guidance message based on GPS accuracy
 * @param accuracy - GPS accuracy in meters
 * @returns Guidance message for the user
 */
export const getGpsGuidanceMessage = (accuracy: number | null | undefined): {
  message: string;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  icon: string;
} => {
  if (!accuracy) {
    return {
      message: "Ingen GPS-data tillgänglig. Positionsdata saknas.",
      level: 'poor',
      icon: '📌'
    };
  }

  if (accuracy < 10) {
    return {
      message: "Utmärkt GPS-signal! Positionen är mycket exakt.",
      level: 'excellent',
      icon: '🎯'
    };
  }

  if (accuracy < 50) {
    return {
      message: "Bra GPS-signal. Positionen är tillräckligt exakt för de flesta ändamål.",
      level: 'good',
      icon: '🎯'
    };
  }

  if (accuracy < 200) {
    return {
      message: "Godtagbar GPS-signal. Positionen kan vara några meter från din faktiska plats.",
      level: 'fair',
      icon: '📍'
    };
  }

  if (accuracy < 1000) {
    return {
      message: "Svag GPS-signal. Positionen kan vara betydligt osäker. Gå utomhus för bättre signal.",
      level: 'fair',
      icon: '📍'
    };
  }

  return {
    message: "Mycket svag GPS-signal. Positionen är mycket osäker. Gå utomhus eller till en öppnare plats.",
    level: 'poor',
    icon: '📌'
  };
};

/**
 * Get color class based on GPS accuracy level
 */
export const getGpsAccuracyColorClass = (level: 'excellent' | 'good' | 'fair' | 'poor'): string => {
  switch (level) {
    case 'excellent':
      return 'text-green-500 border-green-500/20 bg-green-500/10';
    case 'good':
      return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
    case 'fair':
      return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
    case 'poor':
      return 'text-destructive border-destructive/20 bg-destructive/10';
  }
};
