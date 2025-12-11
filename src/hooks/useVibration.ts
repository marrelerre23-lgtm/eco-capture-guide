import { useCallback } from "react";

export const useVibration = () => {
  const canVibrate = "vibrate" in navigator;

  const vibrateClick = useCallback(() => {
    if (canVibrate) {
      navigator.vibrate(10);
    }
  }, [canVibrate]);

  const vibrateSuccess = useCallback(() => {
    if (canVibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  }, [canVibrate]);

  const vibrateError = useCallback(() => {
    if (canVibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [canVibrate]);

  return {
    vibrateClick,
    vibrateSuccess,
    vibrateError,
  };
};
