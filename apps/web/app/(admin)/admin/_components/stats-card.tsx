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

// Modern color schemes - Light pastel backgrounds with vibrant accents
const cardStyles = [
  {
    // Violet/Purple - Primary brand color
    bg: 'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/40 dark:to-purple-900/30',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    textColor: 'text-violet-700 dark:text-violet-300',
    iconColor: 'text-violet-600 dark:text-violet-400',
    descColor: 'text-violet-600/80 dark:text-violet-400/80',
    border: 'border-violet-200/50 dark:border-violet-800/50',
  },
  {
    // Cyan/Teal - Fresh and modern
    bg: 'bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-950/40 dark:to-teal-900/30',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/50',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    descColor: 'text-cyan-600/80 dark:text-cyan-400/80',
    border: 'border-cyan-200/50 dark:border-cyan-800/50',
  },
  {
    // Rose/Pink - Warm accent
    bg: 'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/40 dark:to-pink-900/30',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    textColor: 'text-rose-700 dark:text-rose-300',
    iconColor: 'text-rose-600 dark:text-rose-400',
    descColor: 'text-rose-600/80 dark:text-rose-400/80',
    border: 'border-rose-200/50 dark:border-rose-800/50',
  },
  {
    // Amber/Orange - Energetic
    bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-900/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    textColor: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
    descColor: 'text-amber-600/80 dark:text-amber-400/80',
    border: 'border-amber-200/50 dark:border-amber-800/50',
  },
];

// Get card style based on title
function getCardStyle(title: string) {
  if (title.includes('Total Events') || title.includes('Event')) return cardStyles[0];
  if (title.includes('Upcoming') || title.includes('Team') || title.includes('User')) return cardStyles[1];
  if (title.includes('RSVP') || title.includes('Registration')) return cardStyles[2];
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
        style.border,
        'rounded-2xl border shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group overflow-hidden',
        href && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
        <CardTitle className={cn('text-sm font-semibold tracking-wide uppercase', style.descColor)}>
          {title}
        </CardTitle>
        <div className={cn('p-2.5 rounded-xl transition-all shadow-sm', style.iconBg)}>
          <Icon className={cn('h-5 w-5', style.iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="pb-5 px-5">
        <div className={cn('text-3xl font-bold mb-1 tracking-tight', style.textColor)}>{value}</div>
        <p className={cn('text-sm font-medium', style.descColor)}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
