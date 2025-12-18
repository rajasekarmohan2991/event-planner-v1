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

// Color schemes for different card types
const cardStyles = [
  {
    // Purple gradient - for first card
    bg: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-700',
    iconBg: 'bg-white/10 backdrop-blur-sm group-hover:bg-white/20',
  },
  {
    // Teal gradient - for second card
    bg: 'bg-gradient-to-br from-teal-500 via-emerald-500 to-green-600 dark:from-teal-600 dark:via-emerald-600 dark:to-green-700',
    iconBg: 'bg-white/10 backdrop-blur-sm group-hover:bg-white/20',
  },
  {
    // Blue gradient - for third card
    bg: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 dark:from-blue-600 dark:via-cyan-600 dark:to-blue-700',
    iconBg: 'bg-white/10 backdrop-blur-sm group-hover:bg-white/20',
  },
  {
    // Orange gradient - for fourth card
    bg: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 dark:from-orange-600 dark:via-amber-600 dark:to-yellow-700',
    iconBg: 'bg-white/10 backdrop-blur-sm group-hover:bg-white/20',
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
