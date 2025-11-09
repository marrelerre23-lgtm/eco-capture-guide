import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, RotateCcw, Flashlight, FlashlightOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PhotoPreview } from "@/components/PhotoPreview";
import { uploadCaptureFromDataUrl } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: Date;
  description: string;
  facts: string[];
}

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
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prefer back camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Check if torch is supported
        const videoTrack = mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.() as any;
        if (capabilities?.torch) {
          setTorchSupported(true);
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        variant: "destructive",
        title: "Kamerafel",
        description: "Kunde inte komma åt kameran. Kontrollera behörigheter.",
      });
    }
  };

  const toggleTorch = async () => {
    if (!stream || !torchSupported) {
      toast({
        title: "Ljus ej tillgängligt",
        description: "Din enhet stöder inte kamerans ljus i webbläsaren. Använd den nativa appen för full funktionalitet.",
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
      toast({
        title: newTorchState ? "Ljus påslaget" : "Ljus avslaget",
      });
    } catch (error) {
      console.error("Error toggling torch:", error);
      toast({
        variant: "destructive",
        title: "Kunde inte styra ljuset",
        description: "Ett fel uppstod när ljuset skulle ändras.",
      });
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Kunde inte hämta plats:', error);
        }
      );
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        
        // Get location when photo is captured
        getLocation();
        
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        // Get location when file is uploaded
        getLocation();
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

  return (
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
            
            <Button
              variant="ghost"
              size="icon"
              className={`text-white hover:bg-white/20 backdrop-blur-sm transition-all ${
                torchOn ? 'bg-primary/80' : ''
              }`}
              onClick={toggleTorch}
            >
              {torchOn ? (
                <Flashlight className="h-6 w-6" />
              ) : (
                <FlashlightOff className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
        
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
        capture="environment"
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
            >
              <div className="w-16 h-16 rounded-full bg-current" />
            </Button>
            <span className="text-white text-xs font-semibold">Ta bild</span>
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
  );
};

export default Camera;