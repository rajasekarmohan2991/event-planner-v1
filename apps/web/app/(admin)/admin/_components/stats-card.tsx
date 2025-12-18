import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  className?: string;
  href?: string;
}

// Color schemes for different card types - Lighter, more vibrant
const cardStyles = [
  {
    // Purple gradient - lighter and more vibrant
    bg: 'bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 dark:from-purple-500 dark:via-purple-600 dark:to-indigo-600',
    iconBg: 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30',
  },
  {
    // Teal/Green gradient - lighter and more vibrant
    bg: 'bg-gradient-to-br from-teal-400 via-emerald-400 to-green-500 dark:from-teal-500 dark:via-emerald-500 dark:to-green-600',
    iconBg: 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30',
  },
  {
    // Blue/Cyan gradient - lighter and more vibrant
    bg: 'bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 dark:from-blue-500 dark:via-cyan-500 dark:to-blue-600',
    iconBg: 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30',
  },
  {
    // Orange/Amber gradient - lighter and more vibrant
    bg: 'bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-500 dark:from-orange-500 dark:via-amber-500 dark:to-yellow-600',
    iconBg: 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30',
  },
];

// Get card style based on title
function getCardStyle(title: string) {
  if (title.includes('Total Events') || title.includes('Event')) return cardStyles[0];
  if (title.includes('Upcoming') || title.includes('Team') || title.includes('User')) return cardStyles[1];
  if (title.includes('Total Users') || title.includes('Registration')) return cardStyles[2];
  return cardStyles[3]; // Default for Company/Others
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  href,
}: StatsCardProps) {
  const router = useRouter();
  const style = getCardStyle(title);

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <Card
      className={cn(
        style.bg,
        'rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 group',
        href && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg transition-all', style.iconBg)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <p className="text-sm text-white/80">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
