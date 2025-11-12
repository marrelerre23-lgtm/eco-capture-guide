import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, RotateCcw, Flashlight, FlashlightOff, ZoomIn, ZoomOut, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PhotoPreview } from "@/components/PhotoPreview";
import { PhotoTipsDialog } from "@/components/PhotoTipsDialog";
import { uploadCaptureFromDataUrl } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/utils/imageCompression";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { Slider } from "@/components/ui/slider";

import { Species } from "@/types/species";

const Camera = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const isOnline = useOnlineStatus();
  const { saveOfflineCapture } = useOfflineStorage();
  const [compressing, setCompressing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [tipsDialogOpen, setTipsDialogOpen] = useState(false);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kameran stöds inte i din webbläsare");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prefer back camera
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Check capabilities
        const videoTrack = mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.() as any;
        
        if (capabilities?.torch) {
          setTorchSupported(true);
        }
        
        if (capabilities?.zoom) {
          setZoomSupported(true);
        }
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Kunde inte komma åt kameran.";
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Kamerabehörighet nekad. Ge webbläsaren tillgång till kameran i inställningarna.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "Ingen kamera hittades på enheten.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "Kameran används redan av en annan app. Stäng andra appar som använder kameran.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Kameran stöder inte de begärda inställningarna.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      toast({
        variant: "destructive",
        title: "Kamerafel",
        description: errorMessage,
      });
    }
  };

  const applyZoom = async (newZoom: number) => {
    if (!stream || !zoomSupported) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.zoom) {
        const clampedZoom = Math.max(
          capabilities.zoom.min || 1,
          Math.min(capabilities.zoom.max || 5, newZoom)
        );
        
        await videoTrack.applyConstraints({
          // @ts-ignore
          advanced: [{ zoom: clampedZoom }]
        });
        
        setZoom(clampedZoom);
      }
    } catch (error) {
      console.error("Error applying zoom:", error);
    }
  };

  const toggleTorch = async () => {
    if (!stream || !torchSupported) {
      toast({
        title: "Ljus ej tillgängligt",
        description: "Din enhet stöder inte kamerans ljus i webbläsaren.",
      });
      return;
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const newTorchState = !torchOn;
      
      await videoTrack.applyConstraints({
        // @ts-ignore - torch is not in standard types yet
        advanced: [{ torch: newTorchState }]
      });
      
      setTorchOn(newTorchState);
    } catch (error) {
      console.error("Error toggling torch:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte styra ljuset",
      });
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy // GPS accuracy in meters
          });
        },
        (error) => {
          console.log('Kunde inte hämta plats:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setCompressing(true);
        try {
          ctx.drawImage(video, 0, 0);
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          
          // Compress image before storing
          const compressedImage = await compressImage(imageDataUrl, 1920, 1920, 0.8);
          
          // Save offline if not connected
          if (!isOnline) {
            saveOfflineCapture({ 
              imageUrl: compressedImage,
              location 
            });
          }
          
          setCapturedImage(compressedImage);
          
          // Get location when photo is captured
          getLocation();
          
          toast({
            title: 'Bild tagen!',
            description: isOnline 
              ? 'Bilden är redo för analys.' 
              : 'Bilden sparad offline.'
          });
        } catch (error) {
          console.error('Error compressing image:', error);
          toast({
            variant: 'destructive',
            title: 'Fel',
            description: 'Kunde inte bearbeta bilden.'
          });
        } finally {
          setCompressing(false);
        }
        
        // Turn off torch before stopping camera
        if (stream && torchOn) {
          const videoTrack = stream.getVideoTracks()[0];
          try {
            videoTrack.applyConstraints({
              // @ts-ignore
              advanced: [{ torch: false }]
            });
            setTorchOn(false);
          } catch (error) {
            console.error('Error turning off torch:', error);
          }
        }
        
        // Stop camera when photo is captured
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const uploadFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCompressing(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const originalImage = e.target?.result as string;
          
          // Compress uploaded image
          const compressedImage = await compressImage(originalImage, 1920, 1920, 0.8);
          
          // Save offline if not connected
          if (!isOnline) {
            saveOfflineCapture({ 
              imageUrl: compressedImage,
              location 
            });
          }
          
          setCapturedImage(compressedImage);
          
          // Get location when file is uploaded
          getLocation();
          
          toast({
            title: 'Bild uppladdad!',
            description: isOnline 
              ? 'Bilden är redo för analys.' 
              : 'Bilden sparad offline.'
          });
        } catch (error) {
          console.error('Error processing image:', error);
          toast({
            variant: 'destructive',
            title: 'Fel',
            description: 'Kunde inte bearbeta bilden.'
          });
        } finally {
          setCompressing(false);
        }
        
        // Stop camera when uploading
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(); // Restart camera
  };


  // Start camera when component mounts
  React.useEffect(() => {
    startCamera();
    
    return () => {
      // Cleanup: stop camera when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  if (capturedImage) {
    return (
      <PhotoPreview 
        imageUrl={capturedImage} 
        onRetake={retakePhoto}
        uploading={uploading}
        location={location}
      />
    );
  }

  // Show error state if camera failed
  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">📷</div>
          <h2 className="text-xl font-semibold text-white">Kamera ej tillgänglig</h2>
          <p className="text-white/70">{cameraError}</p>
          <div className="space-y-2">
            <Button
              onClick={startCamera}
              className="w-full"
            >
              Försök igen
            </Button>
            <Button
              variant="outline"
              onClick={uploadFromDevice}
              className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Upload className="mr-2 h-4 w-4" />
              Välj bild istället
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="w-full text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PhotoTipsDialog 
        open={tipsDialogOpen} 
        onOpenChange={setTipsDialogOpen}
      />
      
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Camera View */}
        <div className="relative flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Grid Overlay for Composition */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-20">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/30" />
            ))}
          </div>
        </div>
        
        {/* Top Bar with Instructions */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            
            <div className="text-center flex-1 px-4">
              <p className="text-white text-sm font-medium">Centrera motivet i bilden</p>
              <p className="text-white/70 text-xs mt-1">Håll telefonen stadigt</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => setTipsDialogOpen(true)}
              >
                <HelpCircle className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/20 backdrop-blur-sm transition-all ${
                  torchOn ? 'bg-primary/80' : ''
                }`}
                onClick={toggleTorch}
                disabled={!torchSupported}
              >
                {torchOn ? (
                  <Flashlight className="h-6 w-6" />
                ) : (
                  <FlashlightOff className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Zoom Controls */}
        {zoomSupported && (
          <div className="absolute bottom-32 left-4 right-4 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-4 py-3">
            <ZoomOut className="h-5 w-5 text-white flex-shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={(value) => applyZoom(value[0])}
              min={1}
              max={5}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-5 w-5 text-white flex-shrink-0" />
          </div>
        )}
        
        {/* Focus Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white rounded-lg">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for capturing photos */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Bottom Controls */}
      <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent pb-8 pt-12">
        <div className="flex items-center justify-center gap-12 px-8">
          {/* Upload Button */}
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm rounded-full w-14 h-14 border border-white/20"
              onClick={uploadFromDevice}
            >
              <Upload className="h-6 w-6" />
            </Button>
            <span className="text-white text-xs">Välj bild</span>
          </div>

          {/* Capture Button */}
          <div className="flex flex-col items-center gap-2">
            <Button
              size="icon"
              className="bg-white text-black hover:bg-gray-200 rounded-full w-20 h-20 border-4 border-white/30 shadow-xl hover:scale-105 transition-transform"
              onClick={capturePhoto}
              disabled={compressing}
              aria-label="Ta bild"
            >
              <div className="w-16 h-16 rounded-full bg-current" />
            </Button>
            <span className="text-white text-xs font-semibold">
              {compressing ? 'Bearbetar...' : 'Ta bild'}
            </span>
          </div>

          {/* Flip Camera Button */}
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm rounded-full w-14 h-14 border border-white/20"
              onClick={() => {
                toast({
                  title: "Funktion kommer snart",
                  description: "Möjlighet att byta kamera kommer i nästa version",
                });
              }}
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            <span className="text-white text-xs">Byt kamera</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Camera;