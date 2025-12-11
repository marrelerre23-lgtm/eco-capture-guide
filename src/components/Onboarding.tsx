import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Camera, Search, Book, CheckCircle } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const ONBOARDING_KEY = 'ecocapture_onboarding_completed';

export const hasCompletedOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
};

export const markOnboardingComplete = () => {
  localStorage.setItem(ONBOARDING_KEY, 'true');
};

const steps = [
  {
    icon: Camera,
    title: 'Ta bilder av naturen',
    description: 'Fotografera växter, svampar, insekter och andra naturföremål du hittar.',
    color: 'text-primary'
  },
  {
    icon: Search,
    title: 'AI identifierar automatiskt',
    description: 'Vår AI analyserar bilden och identifierar arten med vetenskapligt namn och beskrivning.',
    color: 'text-accent'
  },
  {
    icon: Book,
    title: 'Bygg din loggbok',
    description: 'Alla dina fynd sparas i din personliga naturloggbok som du kan utforska när som helst.',
    color: 'text-success'
  },
  {
    icon: CheckCircle,
    title: 'Redo att börja!',
    description: 'Tryck på kameraknappen och börja utforska naturen omkring dig.',
    color: 'text-primary'
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const CurrentIcon = steps[currentStep].icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    markOnboardingComplete();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 relative">
          {/* Skip button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleSkip}
            aria-label="Hoppa över introduktion"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Content */}
          <div className="text-center space-y-6 py-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-eco flex items-center justify-center">
                <CurrentIcon className={`h-10 w-10 ${steps[currentStep].color}`} />
              </div>
            </div>

            {/* Title and description */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {steps[currentStep].title}
              </h2>
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className="min-w-6 min-h-6 flex items-center justify-center"
                  aria-label={`Gå till steg ${index + 1}`}
                >
                  <span
                    className={`block h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-primary w-8'
                        : 'bg-muted hover:bg-muted-foreground/50 w-2'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Action button */}
            <Button
              onClick={handleNext}
              className="w-full"
              size="lg"
            >
              {currentStep === steps.length - 1 ? 'Kom igång!' : 'Nästa'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
