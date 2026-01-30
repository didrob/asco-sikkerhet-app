import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardWithTrendProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number; // percentage change, e.g., +15 = up 15%, -10 = down 10%
  trendLabel?: string;
  iconClassName?: string;
}

export function StatCardWithTrend({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs forrige periode',
  iconClassName,
}: StatCardWithTrendProps) {
  const getTrendInfo = () => {
    if (trend === undefined || trend === null) return null;
    
    if (trend > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/50',
        text: `+${trend}%`,
      };
    } else if (trend < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/50',
        text: `${trend}%`,
      };
    } else {
      return {
        icon: Minus,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        text: '0%',
      };
    }
  };

  const trendInfo = getTrendInfo();

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {value}
            </p>
          </div>
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "bg-primary/10"
          )}>
            <Icon className={cn("h-5 w-5 text-primary", iconClassName)} />
          </div>
        </div>
        
        {trendInfo && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trendInfo.bgColor,
              trendInfo.color
            )}>
              <trendInfo.icon className="h-3 w-3" />
              <span>{trendInfo.text}</span>
            </div>
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
