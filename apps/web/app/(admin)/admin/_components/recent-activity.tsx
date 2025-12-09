import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export type ActivityType = {
  id: string;
  user: string;
  action: string;
  time: string;
  avatar: string | null;
};

interface RecentActivityProps {
  activities: ActivityType[];
  isLoading: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No recent activities found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 8).map((activity) => (
        <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Avatar className="h-8 w-8 flex-shrink-0">
            {activity.avatar ? (
              <AvatarImage src={activity.avatar} alt={activity.user} />
            ) : (
              <AvatarFallback className="text-xs">
                {String(activity.user || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">
              {activity.user}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {activity.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
