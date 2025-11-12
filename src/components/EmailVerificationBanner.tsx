import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Mail, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const EmailVerificationBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkEmailVerification();
  }, []);

  const checkEmailVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && !user.email_confirmed_at) {
      setIsVisible(true);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsSending(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Ingen email hittades');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: "Email skickad!",
        description: "Kolla din inkorg och verifiera din email-adress.",
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast({
        variant: 'destructive',
        title: "Kunde inte skicka email",
        description: error instanceof Error ? error.message : "Ett okänt fel uppstod",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 p-4 animate-in slide-in-from-top-5">
      <Alert className="border-amber-500 bg-amber-500/10">
        <Mail className="h-4 w-4 text-amber-500" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <span className="font-medium">Verifiera din email-adress</span>
            <p className="text-sm text-muted-foreground mt-1">
              För att få full tillgång till alla funktioner, vänligen bekräfta din email-adress.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleResendEmail}
              disabled={isSending}
              size="sm"
              variant="default"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skickar...
                </>
              ) : (
                'Skicka igen'
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
