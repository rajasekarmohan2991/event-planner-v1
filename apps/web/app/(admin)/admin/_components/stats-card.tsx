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

// Modern color schemes with vibrant pink/magenta theme and lively icon backgrounds
const cardStyles = [
  {
    // Pink/Magenta - Primary brand color (like hospital dashboard)
    bg: 'bg-white dark:from-pink-950/40 dark:to-fuchsia-900/30',
    iconBg: 'bg-pink-100 dark:bg-pink-900/50',
    textColor: 'text-gray-900 dark:text-pink-300',
    iconColor: 'text-pink-600 dark:text-pink-400',
    descColor: 'text-gray-600 dark:text-pink-400/80',
    border: 'border-gray-200 dark:border-pink-800/50',
  },
  {
    // Blue - Fresh and modern
    bg: 'bg-white dark:from-blue-950/40 dark:to-cyan-900/30',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    textColor: 'text-gray-900 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-400',
    descColor: 'text-gray-600 dark:text-blue-400/80',
    border: 'border-gray-200 dark:border-blue-800/50',
  },
  {
    // Red/Rose - Alert/Important
    bg: 'bg-white dark:from-red-950/40 dark:to-rose-900/30',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    textColor: 'text-gray-900 dark:text-red-300',
    iconColor: 'text-red-600 dark:text-red-400',
    descColor: 'text-gray-600 dark:text-red-400/80',
    border: 'border-gray-200 dark:border-red-800/50',
  },
  {
    // Purple - Secondary accent
    bg: 'bg-white dark:from-purple-950/40 dark:to-violet-900/30',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    textColor: 'text-gray-900 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400',
    descColor: 'text-gray-600 dark:text-purple-400/80',
    border: 'border-gray-200 dark:border-purple-800/50',
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
  backgroundImage,
  logoImage
}: StatsCardProps & { backgroundImage?: string | null; logoImage?: string | null }) {
  const router = useRouter();
  const style = getCardStyle(title);

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  if (backgroundImage) {
    return (
      <Card
        className={cn(
          style.bg,
          'rounded-2xl border-none shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative min-h-[160px] flex flex-col justify-end',
          href && 'cursor-pointer',
          className
        )}
        onClick={handleClick}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 p-5">
          <div className="flex items-center gap-4">
            {logoImage ? (
              <div className="h-12 w-12 rounded-xl bg-white p-1 shadow-lg shrink-0 overflow-hidden flex items-center justify-center">
                <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Icon className="h-5 w-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <CardTitle className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                {title}
              </CardTitle>
              <div className="text-2xl font-bold text-white truncate leading-tight">
                {value}
              </div>
              <p className="text-white/70 text-xs font-medium mt-1 truncate">
                {description}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

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
        {logoImage ? (
          <div className="h-10 w-10 rounded-full overflow-hidden shadow-sm border border-gray-100">
            <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className={cn('p-2.5 rounded-xl transition-all shadow-sm', style.iconBg)}>
            <Icon className={cn('h-5 w-5', style.iconColor)} />
          </div>
        )}
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
