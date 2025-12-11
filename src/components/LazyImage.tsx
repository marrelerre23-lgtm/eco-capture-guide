import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  useSignedUrls?: boolean;
}

export const LazyImage = ({ src, alt, className, aspectRatio = "aspect-square", useSignedUrls = true }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  // Only fetch signed URL when in view and if signed URLs are enabled
  const { signedUrl, loading: urlLoading } = useSignedUrl(inView && useSignedUrls ? src : null);
  const imageSrc = useSignedUrls ? (signedUrl || src) : src;

  return (
    <div ref={ref} className={cn(aspectRatio, "relative bg-muted overflow-hidden", className)}>
      {inView && (
        <>
          {(!isLoaded || urlLoading) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <img
            src={imageSrc}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded && !urlLoading ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
          />
        </>
      )}
    </div>
  );
};
