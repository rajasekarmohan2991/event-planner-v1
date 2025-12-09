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

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  href,
}: StatsCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <Card 
      className={cn(
        'bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100/50 transition-all hover:shadow-md',
        href && 'cursor-pointer hover:shadow-lg hover:border-indigo-300 hover:from-indigo-50/40 hover:to-purple-50/30',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
