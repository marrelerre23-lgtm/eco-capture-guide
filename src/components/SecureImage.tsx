import { useSignedUrl } from '@/hooks/useSignedUrl';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SecureImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Image component that automatically handles signed URLs for private storage.
 * Note: Shares signed-URL logic with LazyImage. LazyImage adds lazy loading
 * via react-intersection-observer — keep both until a unified component is warranted.
 */
export const SecureImage = ({ src, alt, className, fallback }: SecureImageProps) => {
  const { signedUrl, loading } = useSignedUrl(src);

  if (!src) {
    return fallback || null;
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <img 
      src={signedUrl || src} 
      alt={alt} 
      className={className}
    />
  );
};
