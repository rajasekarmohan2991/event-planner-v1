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

// Color schemes for different card types - Light, subtle pastels (NO YELLOW)
const cardStyles = [
  {
    // Soft Lavender - light purple
    bg: 'bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-purple-100 dark:via-purple-200 dark:to-indigo-200',
    iconBg: 'bg-purple-200/40 group-hover:bg-purple-200/60',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600',
    descColor: 'text-purple-700',
  },
  {
    // Soft Mint - light green
    bg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 dark:from-emerald-100 dark:via-teal-100 dark:to-green-200',
    iconBg: 'bg-emerald-200/40 group-hover:bg-emerald-200/60',
    textColor: 'text-emerald-900',
    iconColor: 'text-emerald-600',
    descColor: 'text-emerald-700',
  },
  {
    // Soft Sky Blue - light blue
    bg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100 dark:from-blue-100 dark:via-sky-100 dark:to-cyan-200',
    iconBg: 'bg-blue-200/40 group-hover:bg-blue-200/60',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
    descColor: 'text-blue-700',
  },
  {
    // Soft Rose - light pink (NO YELLOW!)
    bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 dark:from-rose-100 dark:via-pink-100 dark:to-rose-200',
    iconBg: 'bg-rose-200/40 group-hover:bg-rose-200/60',
    textColor: 'text-rose-900',
    iconColor: 'text-rose-600',
    descColor: 'text-rose-700',
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
        'rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200/50 group',
        href && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
        <CardTitle className={cn('text-sm font-medium', style.descColor)}>
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg transition-all', style.iconBg)}>
          <Icon className={cn('h-4 w-4', style.iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className={cn('text-2xl font-bold mb-1', style.textColor)}>{value}</div>
        <p className={cn('text-xs', style.descColor)}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
