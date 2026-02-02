
import { Activity, CreditCard, DollarSign, Users } from 'lucide-react';

interface ActivityItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
}

export default function RecentActivities() {
  const activities: ActivityItem[] = [
    {
      title: "Total Events",
      description: "Upcoming events",
      icon: <Activity className="h-4 w-4" />,
      value: "12"
    },
    {
      title: "Revenue",
      description: "Total revenue",
      icon: <DollarSign className="h-4 w-4" />,
      value: "$45,231.89"
    },
    {
      title: "Attendees",
      description: "Total attendees",
      icon: <Users className="h-4 w-4" />,
      value: "+2350"
    },
    {
      title: "Tickets Sold",
      description: "Total tickets sold",
      icon: <CreditCard className="h-4 w-4" />,
      value: "+12,234"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {activities.map((activity, index) => (
        <div key={index} className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {activity.title}
            </h3>
            {activity.icon}
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold">{activity.value}</p>
            <p className="text-xs text-muted-foreground">
              {activity.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
