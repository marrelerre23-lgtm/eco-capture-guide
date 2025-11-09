import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { Achievement, UserAchievement } from "@/hooks/useAchievements";

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number;
}

export const AchievementBadge = ({ achievement, userAchievement, progress = 0 }: AchievementBadgeProps) => {
  const isUnlocked = !!userAchievement;

  return (
    <Card className={`overflow-hidden transition-all ${isUnlocked ? 'shadow-lg' : 'opacity-60'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`text-4xl flex-shrink-0 ${!isUnlocked && 'grayscale'}`}>
            {isUnlocked ? achievement.icon : <Lock className="h-8 w-8 text-muted-foreground" />}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm">{achievement.name}</h4>
              {isUnlocked && (
                <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                  Upplåst
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {achievement.description}
            </p>

            {/* Progress bar for locked achievements */}
            {!isUnlocked && progress > 0 && (
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Framsteg</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Unlocked date */}
            {isUnlocked && userAchievement && (
              <p className="text-xs text-muted-foreground">
                Upplåst {new Date(userAchievement.unlocked_at).toLocaleDateString('sv-SE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
