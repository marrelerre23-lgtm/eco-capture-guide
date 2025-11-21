import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, User, LogOut, Mail, Calendar, Camera, Lock, Sparkles, Crown, Download, Bell, Trophy, FileJson, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { uploadAvatarImage } from "@/utils/storage";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { Badge } from "@/components/ui/badge";
import { exportToCSV, exportToJSON } from "@/utils/exportData";
import { useSpeciesCaptures } from "@/hooks/useSpeciesCaptures";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Switch } from "@/components/ui/switch";
import { forceAppUpdate, clearAllCaches } from "@/utils/serviceWorkerManager";
import { RefreshCw, Trash2 } from "lucide-react";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile>({
    display_name: null,
    avatar_url: null,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const { subscription, loading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const { data: captures, isLoading: capturesLoading } = useSpeciesCaptures();
  const { permission, requestPermission, hasPermission } = usePushNotifications();
  const { achievements } = useAchievements();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Kunde inte ladda profil",
        description: error instanceof Error ? error.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Profil uppdaterad",
        description: "Dina ändringar har sparats.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Kunde inte uppdatera profil",
        description: error instanceof Error ? error.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const avatarUrl = await uploadAvatarImage(file);
      
      // Update profile with new avatar URL
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: avatarUrl,
          display_name: profile.display_name,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setProfile({ ...profile, avatar_url: avatarUrl });
      toast({
        title: "Profilbild uppdaterad",
        description: "Din nya profilbild har sparats.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Kunde inte ladda upp profilbild",
        description: error instanceof Error ? error.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Fyll i båda fälten",
        description: "Du måste ange och bekräfta ditt nya lösenord.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lösenorden matchar inte",
        description: "De två lösenorden måste vara identiska.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lösenordet är för kort",
        description: "Lösenordet måste vara minst 6 tecken långt.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Lösenord uppdaterat",
        description: "Ditt nya lösenord har sparats.",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Kunde inte uppdatera lösenord",
        description: error instanceof Error ? error.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!captures || captures.length === 0) {
      toast({
        title: "Ingen data att exportera",
        description: "Du har inga fångster att exportera ännu.",
        variant: "destructive",
      });
      return;
    }

    const exportData = captures.map(capture => ({
      id: capture.id,
      name: capture.ai_analysis?.species?.commonName || "Okänd",
      scientificName: capture.ai_analysis?.species?.scientificName || "Okänd",
      category: capture.ai_analysis?.species?.category || "annat",
      capturedAt: new Date(capture.captured_at).toISOString(),
      location: capture.location_name || "",
      latitude: capture.latitude,
      longitude: capture.longitude,
      description: capture.ai_analysis?.species?.description || "",
      habitat: capture.ai_analysis?.species?.habitat || "",
      rarity: capture.ai_analysis?.species?.rarity || "",
      confidence: capture.ai_analysis?.species?.confidence,
      notes: capture.notes || "",
      isFavorite: capture.is_favorite || false,
    }));

    exportToCSV(exportData);
    toast({
      title: "Export klar!",
      description: `${captures.length} fångster exporterade till CSV.`,
    });
  };

  const handleExportJSON = () => {
    if (!captures || captures.length === 0) {
      toast({
        title: "Ingen data att exportera",
        description: "Du har inga fångster att exportera ännu.",
        variant: "destructive",
      });
      return;
    }

    const exportData = captures.map(capture => ({
      id: capture.id,
      name: capture.ai_analysis?.species?.commonName || "Okänd",
      scientificName: capture.ai_analysis?.species?.scientificName || "Okänd",
      category: capture.ai_analysis?.species?.category || "annat",
      capturedAt: new Date(capture.captured_at).toISOString(),
      location: capture.location_name || "",
      latitude: capture.latitude,
      longitude: capture.longitude,
      description: capture.ai_analysis?.species?.description || "",
      habitat: capture.ai_analysis?.species?.habitat || "",
      rarity: capture.ai_analysis?.species?.rarity || "",
      confidence: capture.ai_analysis?.species?.confidence,
      notes: capture.notes || "",
      isFavorite: capture.is_favorite || false,
    }));

    exportToJSON(exportData);
    toast({
      title: "Export klar!",
      description: `${captures.length} fångster exporterade till JSON.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = profile.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full h-8 w-8"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {profile.display_name || 'Din Profil'}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
          </div>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profilinställningar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Visningsnamn</Label>
              <Input
                id="display_name"
                type="text"
                value={profile.display_name || ''}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="Ditt namn"
              />
            </div>

            <Button 
              onClick={updateProfile} 
              className="w-full"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara ändringar
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Ändra lösenord
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nytt lösenord</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minst 6 tecken"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Bekräfta nytt lösenord</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ange lösenordet igen"
              />
            </div>

            <Button 
              onClick={handlePasswordChange}
              className="w-full"
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uppdatera lösenord
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card className={subscription?.tier !== 'free' ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {subscription?.tier !== 'free' ? (
                  <Crown className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                Prenumeration
              </div>
              <div className="flex items-center gap-2">
                {subscription?.tier !== 'free' && (
                  <Badge variant="default" className="bg-gradient-to-r from-primary to-accent border-0">
                    Premium
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="h-8 px-2 text-xs"
                >
                  {showDebug ? 'Dölj' : 'Debug'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionLoading ? (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Laddar prenumeration...</p>
              </div>
            ) : subscriptionError ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium mb-1">Fel vid laddning</p>
                <p className="text-xs text-destructive/80">{subscriptionError}</p>
              </div>
            ) : subscription ? (
              <>
                {showDebug && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-border mb-4">
                    <p className="text-xs font-mono mb-2 font-semibold">Debug Info:</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(subscription, null, 2)}
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2">
                      Loading: {subscriptionLoading ? 'Ja' : 'Nej'} | Error: {subscriptionError || 'Inget'}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="text-sm font-medium capitalize">
                      {subscription.tier === 'free' ? 'Gratis' : subscription.tier}
                    </span>
                  </div>
                  
                  {subscription.tier === 'free' && (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Analyser idag</span>
                        <span className="text-sm font-medium">
                          {subscription.analysesToday} / {subscription.maxAnalysesPerDay || '∞'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Sparade fångster</span>
                        <span className="text-sm font-medium">
                          {subscription.capturesCount} / {subscription.maxCaptures || '∞'}
                        </span>
                      </div>
                    </>
                  )}
                  
                {subscription.tier !== 'free' && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className="border-green-500 text-green-500">
                      Aktiv
                    </Badge>
                  </div>
                )}
                
                {subscription.tier !== 'free' && subscription.subscription_end && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Nästa faktura</span>
                    <span className="text-sm font-medium">
                      {new Date(subscription.subscription_end).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                )}
                </div>

                {subscription.tier === 'free' && (
                  <div className="pt-2">
                    <Button 
                      onClick={() => setUpgradeDialogOpen(true)} 
                      className="w-full"
                      size="lg"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Uppgradera till Premium
                    </Button>
                    
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground text-center">
                        Med Premium får du obegränsade analyser, ingen annonser, och mycket mer!
                      </p>
                    </div>
                  </div>
                )}
                
                 {subscription.tier !== 'free' && (
                  <div className="pt-2">
                    <Button 
                      onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session) throw new Error('Not authenticated');
                          
                          const { data, error } = await supabase.functions.invoke('customer-portal', {
                            headers: { Authorization: `Bearer ${session.access_token}` },
                          });
                          
                          if (error) throw error;
                          if (data?.url) window.open(data.url, '_blank');
                        } catch (error) {
                          toast({
                            variant: 'destructive',
                            title: 'Kunde inte öppna prenumerationshantering',
                            description: error instanceof Error ? error.message : 'Ett fel uppstod',
                          });
                        }
                      }} 
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Hantera prenumeration
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Ingen prenumerationsinformation tillgänglig</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportera data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Exportera alla dina fångster till CSV eller JSON-format.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={capturesLoading || !captures || captures.length === 0}
                className="w-full"
              >
                {capturesLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleExportJSON}
                disabled={capturesLoading || !captures || captures.length === 0}
                className="w-full"
              >
                {capturesLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileJson className="mr-2 h-4 w-4" />
                )}
                JSON
              </Button>
            </div>
            {captures && captures.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {captures.length} fångster att exportera
              </p>
            )}
          </CardContent>
        </Card>

        {/* App Reset & Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              App-återställning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Om appen fungerar konstigt eller inte uppdateras korrekt, kan du rensa cacheminnet eller tvinga en fullständig uppdatering.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await clearAllCaches();
                    toast({
                      title: "Cache rensat",
                      description: "All cachad data har rensats. Laddar om...",
                    });
                    setTimeout(() => window.location.reload(), 1000);
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Kunde inte rensa cache",
                      description: error instanceof Error ? error.message : "Ett fel uppstod",
                    });
                  }
                }}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Rensa cache
              </Button>
              
              <Button
                variant="destructive"
                onClick={async () => {
                  if (confirm('Detta kommer att rensa ALL cachad data och ladda om appen. Fortsätt?')) {
                    await forceAppUpdate();
                  }
                }}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tvinga fullständig uppdatering
              </Button>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Tips: Använd "Tvinga fullständig uppdatering" om kartan eller andra funktioner inte fungerar korrekt.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikationer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="text-base">
                  Push-notiser
                </Label>
                <p className="text-sm text-muted-foreground">
                  Få påminnelser om nya arter att upptäcka
                </p>
              </div>
              <Switch
                id="notifications"
                checked={hasPermission}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestPermission();
                  }
                }}
              />
            </div>
            {permission === 'denied' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive">
                  Notiser är blockerade. Aktivera dem i webbläsarens inställningar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Prestationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {achievements.slice(0, 6).map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
              {achievements.length > 6 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  +{achievements.length - 6} fler prestationer
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Button 
          variant="destructive" 
          onClick={handleSignOut}
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logga ut
        </Button>
      </div>

      <UpgradeDialog 
        open={upgradeDialogOpen} 
        onOpenChange={setUpgradeDialogOpen}
      />
    </div>
  );
};

export default function ProfileWithErrorBoundary() {
  return (
    <RouteErrorBoundary routeName="Profile">
      <Profile />
    </RouteErrorBoundary>
  );
}
