import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Ogiltig e-postadress" })
    .max(255, { message: "E-postadressen är för lång" }),
  password: z.string()
    .min(8, { message: "Lösenordet måste vara minst 8 tecken" })
    .max(128, { message: "Lösenordet är för långt" }),
});

const signupSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Ogiltig e-postadress" })
    .max(255, { message: "E-postadressen är för lång" }),
  password: z.string()
    .min(8, { message: "Lösenordet måste vara minst 8 tecken" })
    .max(128, { message: "Lösenordet är för långt" })
    .regex(/[A-Z]/, { message: "Måste innehålla minst en stor bokstav" })
    .regex(/[a-z]/, { message: "Måste innehålla minst en liten bokstav" })
    .regex(/[0-9]/, { message: "Måste innehålla minst en siffra" }),
  confirmPassword: z.string(),
  displayName: z.string()
    .trim()
    .min(2, { message: "Namnet måste vara minst 2 tecken" })
    .max(50, { message: "Namnet får vara max 50 tecken" })
    .regex(/^[a-zA-ZåäöÅÄÖ0-9\s]+$/, { message: "Endast bokstäver, siffror och mellanslag" })
    .optional()
    .or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
});

// Translate Supabase error messages to Swedish
const translateSupabaseError = (error: string): string => {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Fel e-postadress eller lösenord",
    "Email not confirmed": "E-postadressen har inte bekräftats. Kontrollera din inkorg.",
    "User already registered": "Ett konto med denna e-postadress finns redan",
    "Password should be at least 6 characters": "Lösenordet måste vara minst 6 tecken",
    "Unable to validate email address: invalid format": "Ogiltig e-postadress",
    "Email rate limit exceeded": "För många försök. Försök igen senare.",
    "For security purposes, you can only request this once every 60 seconds": "Av säkerhetsskäl kan du bara begära detta en gång per minut",
    "Signup is disabled": "Registrering är tillfälligt avstängd",
    "User not found": "Användaren hittades inte",
  };
  
  return errorMap[error] || error;
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validationResult = loginSchema.safeParse({ email, password });
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          variant: "destructive",
          title: "Valideringsfel",
          description: firstError.message,
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Inloggning misslyckades",
          description: translateSupabaseError(error.message),
        });
      } else {
        toast({
          title: "Välkommen tillbaka!",
          description: "Du är nu inloggad.",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ett oväntat fel uppstod",
        description: "Försök igen senare.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validationResult = signupSchema.safeParse({ 
        email, 
        password,
        confirmPassword,
        displayName: displayName || ""
      });
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          variant: "destructive",
          title: "Valideringsfel",
          description: firstError.message,
        });
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: validationResult.data.email,
        password: validationResult.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: validationResult.data.displayName || "",
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Registrering misslyckades",
          description: translateSupabaseError(error.message),
        });
      } else {
        toast({
          title: "Registrering lyckades!",
          description: "Kontrollera din e-post för att bekräfta ditt konto.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ett oväntat fel uppstod",
        description: "Försök igen senare.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">EcoCapture</CardTitle>
          <CardDescription>Utforska och samla naturens skatter</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Logga in</TabsTrigger>
              <TabsTrigger value="signup">Registrera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Lösenord</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading}
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Kom ihåg mig
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Logga in
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="w-full text-sm"
                  onClick={() => navigate('/forgot-password')}
                >
                  Glömt lösenord?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Visningsnamn</Label>
                  <Input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-post</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    Lösenord <span className="text-muted-foreground text-xs">(minst 8 tecken, 1 stor bokstav, 1 siffra)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={8}
                      placeholder="Minst 8 tecken, 1 stor bokstav, 1 siffra"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Skriv lösenordet igen"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Dölj lösenord" : "Visa lösenord"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="age-verification"
                    required
                    disabled={loading}
                    className="mt-1"
                  />
                  <label htmlFor="age-verification" className="text-sm text-muted-foreground leading-tight">
                    Jag bekräftar att jag är minst 13 år gammal och godkänner{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      användarvillkoren
                    </a>
                    {' '}och{' '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      integritetspolicyn
                    </a>
                  </label>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrera
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default function AuthWithErrorBoundary() {
  return (
    <RouteErrorBoundary routeName="Auth">
      <Auth />
    </RouteErrorBoundary>
  );
}