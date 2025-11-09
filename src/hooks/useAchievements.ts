import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  created_at: string;
  achievement?: Achievement;
}

export const useAchievements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available achievements
  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's unlocked achievements
  const { data: userAchievements } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async (): Promise<UserAchievement[]> => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements (*)
        `)
        .eq("user_id", user.data.user.id)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Unlock achievement mutation
  const unlockMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.data.user.id,
          achievement_id: achievementId,
        })
        .select(`
          *,
          achievement:achievements (*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      
      const achievement = (data as any).achievement;
      if (achievement) {
        toast({
          title: "🎉 Achievement Unlocked!",
          description: `${achievement.icon} ${achievement.name}`,
          duration: 5000,
        });
      }
    },
  });

  // Check if user has unlocked specific achievement
  const hasAchievement = (achievementKey: string): boolean => {
    if (!userAchievements) return false;
    return userAchievements.some(
      ua => (ua.achievement as any)?.key === achievementKey
    );
  };

  // Calculate progress for an achievement
  const getProgress = (achievementKey: string, currentValue: number): number => {
    const achievement = achievements?.find(a => a.key === achievementKey);
    if (!achievement) return 0;
    return Math.min(100, (currentValue / achievement.requirement_value) * 100);
  };

  return {
    achievements: achievements || [],
    userAchievements: userAchievements || [],
    unlockAchievement: unlockMutation.mutate,
    hasAchievement,
    getProgress,
    unlockedCount: userAchievements?.length || 0,
    totalCount: achievements?.length || 0,
  };
};
