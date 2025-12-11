// Toast types - actual rendering handled by Sonner
import * as React from "react";

type ToastProps = {
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

type ToastActionElement = React.ReactElement;

export { type ToastProps, type ToastActionElement };
