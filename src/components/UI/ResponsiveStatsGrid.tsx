import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import MobileCard from './MobileCard';
import clsx from 'clsx';

interface StatItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

interface ResponsiveStatsGridProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const ResponsiveStatsGrid: React.FC<ResponsiveStatsGridProps> = ({
  stats,
  columns = 4,
  className
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={clsx(
      'grid gap-4 md:gap-6',
      gridClasses[columns],
      className
    )}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <MobileCard
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            onClick={stat.onClick}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default ResponsiveStatsGrid;
