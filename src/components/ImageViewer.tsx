import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewer = ({ imageUrl, alt, isOpen, onClose }: ImageViewerProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-screen p-0 border-0 bg-black/95">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
