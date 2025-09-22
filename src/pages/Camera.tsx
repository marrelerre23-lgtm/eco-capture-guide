import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, RotateCcw } from "lucide-react";
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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prefer back camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
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
  }, []);

  if (capturedImage) {
    return (
      <PhotoPreview 
        imageUrl={capturedImage} 
        onRetake={retakePhoto}
        uploading={uploading}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Camera View */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
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

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 bg-black/50 text-white hover:bg-black/70"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Camera Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8">
        {/* Upload Button */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
          onClick={uploadFromDevice}
        >
          <Upload className="h-6 w-6" />
        </Button>

        {/* Capture Button */}
        <Button
          size="icon"
          className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 border-4 border-white/50"
          onClick={capturePhoto}
        >
          <div className="w-12 h-12 rounded-full bg-current" />
        </Button>

        {/* Flip Camera Button (placeholder) */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
          onClick={() => {}} // Placeholder for camera flip functionality
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Camera;