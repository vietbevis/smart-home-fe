'use client';

import { Thermometer, Droplets, Wind } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'gas';
  value: number | undefined;
}

const SENSOR_CONFIG = {
  temperature: { 
    label: 'Temperature', 
    icon: Thermometer, 
    unit: '°C', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    warningThreshold: 35,
  },
  humidity: { 
    label: 'Humidity', 
    icon: Droplets, 
    unit: '%', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    warningThreshold: 80,
  },
  gas: { 
    label: 'Gas Level', 
    icon: Wind, 
    unit: 'ppm', 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    warningThreshold: 500,
  },
};

export function SensorCard({ type, value }: SensorCardProps) {
  const config = SENSOR_CONFIG[type];
  const Icon = config.icon;
  const isWarning = value !== undefined && value > config.warningThreshold;

  return (
    <Card className={cn('transition-smooth', isWarning && 'ring-2 ring-warning/50')}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', config.bgColor)}>
            <Icon className={cn('h-6 w-6', config.color)} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{config.label}</p>
            <p className={cn('text-2xl font-bold', isWarning && 'text-warning')}>
              {value !== undefined ? `${value}${config.unit}` : '--'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
