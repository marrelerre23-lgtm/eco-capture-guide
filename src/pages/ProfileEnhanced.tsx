import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, Mail, Lock, Shield, Camera, TrendingUp, Info, HelpCircle, FileText, Trash2, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSpeciesCaptures } from "@/hooks/useSpeciesCaptures";
import { StatsChart } from "@/components/StatsChart";
import { Badge } from "@/components/ui/badge";
import { ShareDialog } from "@/components/ShareDialog";
import { ProfileSkeleton } from "@/components/LoadingSkeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // 1. Delete all user's captures (and their storage files)
      const { data: captures } = await supabase
        .from('species_captures')
        .select('image_url')
        .eq('user_id', user.id);
      
      // Delete storage files
      if (captures && captures.length > 0) {
        const filePaths = captures
          .map(c => {
            const match = c.image_url?.match(/captures\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];
        
        if (filePaths.length > 0) {
          await supabase.storage.from('captures').remove(filePaths);
        }
      }

      // Delete avatar if exists
      if (profile.avatar_url) {
        const avatarMatch = profile.avatar_url.match(/avatars\/(.+)$/);
        if (avatarMatch) {
          await supabase.storage.from('avatars').remove([avatarMatch[1]]);
        }
      }

      // 2. Delete all captures from database
      await supabase
        .from('species_captures')
        .delete()
        .eq('user_id', user.id);

      // 3. Delete user achievements
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', user.id);

      // 4. Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      // 5. Sign out and delete auth user via edge function
      const { error: deleteError } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: user.id }
      });

      if (deleteError) {
        console.error('Error deleting auth user:', deleteError);
        // Still sign out even if edge function fails
      }

      // Sign out
      await supabase.auth.signOut();
      
      toast({
        title: "Konto raderat",
        description: "Ditt konto och all data har tagits bort permanent.",
      });
      
      navigate('/auth');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Kunde inte radera konto",
        description: error.message || "Ett fel uppstod vid radering av kontot.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
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

            {/* Danger Zone - Delete Account */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Farligt område
                </CardTitle>
                <CardDescription>
                  Permanenta åtgärder som inte kan ångras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Radera mitt konto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Radera konto permanent?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          Detta kommer att <strong>permanent radera</strong> ditt konto och all tillhörande data, inklusive:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Alla dina {stats.total} sparade fångster</li>
                          <li>Alla uppladdade bilder</li>
                          <li>Din profilbild</li>
                          <li>Alla prestationer och statistik</li>
                        </ul>
                        <p className="text-destructive font-medium mt-3">
                          Denna åtgärd kan inte ångras!
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Raderar...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Ja, radera mitt konto
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Button
              variant="outline"
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
