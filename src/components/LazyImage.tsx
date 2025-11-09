import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export const LazyImage = ({ src, alt, className, aspectRatio = "aspect-square" }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className={cn(aspectRatio, "relative bg-muted overflow-hidden", className)}>
      {inView && (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
          />
        </>
      )}
    </div>
  );
};
