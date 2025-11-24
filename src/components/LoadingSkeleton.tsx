import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const LogbookSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-4">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
          
          {/* Search Bar Skeleton */}
          <Skeleton className="h-10 w-full rounded-md" />
          
          {/* Toggle Skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Categories Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export const OverviewSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-6">
        {/* Carousel Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Card className="overflow-hidden shadow-card">
            <Skeleton className="aspect-square w-full" />
          </Card>
        </div>

        {/* Statistics Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MapSkeleton = () => {
  return (
    <div className="fixed inset-0 pt-16 pb-20 bg-background">
      <div className="absolute top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      
      <div className="h-full w-full bg-muted flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="h-12 w-12 mx-auto rounded-full" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
};

// #21: Profile page skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-6">
        {/* Header with avatar */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="text-center space-y-2">
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// #21: Analysis Result skeleton
export const AnalysisResultSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* Image skeleton */}
        <Card className="overflow-hidden">
          <Skeleton className="aspect-square w-full" />
        </Card>

        {/* Alternatives */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-3 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex-shrink-0 w-48">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Confidence */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Species info */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
};
