import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Facebook, Twitter, Link2, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  capture: {
    id: string;
    image_url: string;
    species_name: string;
    scientific_name?: string;
  };
}

export const ShareDialog = ({ isOpen, onClose, capture }: ShareDialogProps) => {
  const { toast } = useToast();

  const shareUrl = window.location.origin + '/capture/' + capture.id;
  const shareText = `Kolla in denna ${capture.species_name}${
    capture.scientific_name ? ` (${capture.scientific_name})` : ''
  } som jag hittade! 🌿`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Länk kopierad!",
        description: "Delningslänken har kopierats till urklipp.",
      });
    } catch (error) {
      toast({
        title: "Kunde inte kopiera länk",
        description: "Försök igen eller dela manuellt.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform: string) => {
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Kolla in min fångst!')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // Native Web Share API with image (for mobile devices)
  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      // Try to share with image if supported
      if (navigator.canShare) {
        try {
          // Fetch the image as a blob
          const response = await fetch(capture.image_url);
          const blob = await response.blob();
          const file = new File([blob], 'capture.jpg', { type: blob.type });

          const shareData = {
            title: capture.species_name,
            text: shareText,
            files: [file],
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toast({
              title: "Delat! 🎉",
              description: "Fångsten har delats med bild.",
            });
            return;
          }
        } catch (error) {
          console.log('Could not share with image, falling back to URL only');
        }
      }

      // Fallback to sharing without image
      await navigator.share({
        title: capture.species_name,
        text: shareText,
        url: shareUrl,
      });
      
      toast({
        title: "Delat! 🎉",
        description: "Fångsten har delats.",
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        toast({
          title: "Kunde inte dela",
          description: "Försök kopiera länken istället.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dela fångst</DialogTitle>
          <DialogDescription>
            Dela din fantastiska fångst med andra!
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="rounded-lg overflow-hidden border">
          <div className="aspect-square relative">
            <img
              src={capture.image_url}
              alt={capture.species_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3 bg-muted/50">
            <h4 className="font-semibold">{capture.species_name}</h4>
            {capture.scientific_name && (
              <p className="text-sm text-muted-foreground italic">
                {capture.scientific_name}
              </p>
            )}
          </div>
        </div>

        {/* Share buttons */}
        <div className="space-y-2">
          {/* Native share button (mobile) */}
          {navigator.share && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNativeShare}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Dela via...
            </Button>
          )}

          {/* Social media buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare('email')}
            >
              <Mail className="h-4 w-4 mr-2" />
              E-post
            </Button>
          </div>

          {/* Copy link button */}
          <Button
            variant="default"
            className="w-full"
            onClick={handleCopyLink}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Kopiera länk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
