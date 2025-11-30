import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, LogOut, User, Mail, Lock, Shield, Camera, TrendingUp, Share2, Info, HelpCircle, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSpeciesCaptures } from "@/hooks/useSpeciesCaptures";
import { StatsChart } from "@/components/StatsChart";
import { Badge } from "@/components/ui/badge";
import { ShareDialog } from "@/components/ShareDialog";
import { ProfileSkeleton } from "@/components/LoadingSkeleton";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

const ProfileEnhanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile>({ display_name: null, avatar_url: null });
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: captures } = useSpeciesCaptures();

  // Calculate user stats
  const stats = useMemo(() => {
    if (!captures) return { total: 0, thisWeek: 0, thisMonth: 0, favorites: 0, rare: 0 };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: captures.length,
      thisWeek: captures.filter(c => new Date(c.captured_at) > weekAgo).length,
      thisMonth: captures.filter(c => new Date(c.captured_at) > monthAgo).length,
      favorites: captures.filter(c => c.is_favorite).length,
      rare: captures.filter(c => {
        const rarity = c.ai_analysis?.species?.rarity?.toLowerCase();
        return rarity && (rarity.includes('sällsynt') || rarity.includes('ovanlig') || rarity.includes('rare'));
      }).length,
    };
  }, [captures]);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        navigate('/auth');
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error: any) {
      toast({
        title: "Kunde inte ladda profil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      
      toast({
        title: "Profil uppdaterad",
        description: "Dina ändringar har sparats.",
      });
    } catch (error: any) {
      toast({
        title: "Kunde inte uppdatera profil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setAvatarUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });

      toast({
        title: "Profilbild uppdaterad",
        description: "Din nya profilbild har laddats upp.",
      });
    } catch (error: any) {
      toast({
        title: "Kunde inte ladda upp bild",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Lösenorden matchar inte",
        description: "Kontrollera att båda lösenorden är identiska.",
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Lösenord ändrat",
        description: "Ditt lösenord har uppdaterats.",
      });
    } catch (error: any) {
      toast({
        title: "Kunde inte ändra lösenord",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Kunde inte logga ut",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.display_name || "Användare"}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </p>
                <Badge variant="secondary" className="text-xs mt-2">
                  {stats.total} fångster
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats">
              <TrendingUp className="h-4 w-4 mr-2" />
              Statistik
            </TabsTrigger>
            <TabsTrigger value="settings">
              <User className="h-4 w-4 mr-2" />
              Inställningar
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{stats.thisWeek}</p>
                    <p className="text-sm text-muted-foreground">Denna vecka</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-success">{stats.thisMonth}</p>
                    <p className="text-sm text-muted-foreground">Denna månad</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-accent">{stats.favorites}</p>
                    <p className="text-sm text-muted-foreground">Favoriter</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-warning">{stats.rare}</p>
                    <p className="text-sm text-muted-foreground">Sällsynta</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <StatsChart captures={captures || []} />
          </TabsContent>


          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profilinställningar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Visningsnamn</Label>
                  <Input
                    id="displayName"
                    value={profile.display_name || ""}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => updateProfile({ display_name: profile.display_name })}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Spara ändringar
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Ändra lösenord
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nytt lösenord</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handlePasswordChange} disabled={!newPassword || !confirmPassword}>
                  Ändra lösenord
                </Button>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Kontoinformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>E-post</span>
                  <span>{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medlem sedan</span>
                  <span>{new Date(user?.created_at).toLocaleDateString('sv-SE')}</span>
                </div>
              </CardContent>
            </Card>

            {/* App Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/about')}
                >
                  <Info className="mr-2 h-4 w-4" />
                  Om EcoCapture
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/help')}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Hjälp & FAQ
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/privacy')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Integritetspolicy
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/terms')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Användarvillkor
                </Button>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logga ut
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileEnhanced;
