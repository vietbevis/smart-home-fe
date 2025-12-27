'use client';

import { Flame, Wind, Sun, Moon, CloudRain, CloudSun, Activity, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SensorData, DeviceState, DeviceId } from '@/types';

interface SensorPanelProps {
  sensors: SensorData;
  devices?: Record<DeviceId, DeviceState>;
}

export function SensorPanel({ sensors, devices }: SensorPanelProps) {
  const gasLevel = sensors.gas?.level ?? 0;
  const gasThreshold = sensors.gas?.threshold ?? 2000;
  const gasPercent = Math.min((gasLevel / gasThreshold) * 100, 100);
  const isGasDanger = gasLevel > gasThreshold;
  const isGasWarning = gasLevel > gasThreshold * 0.7;

  const fireDetected = sensors.fire?.detected ?? false;
  
  const dryerRackOpen = devices?.dryer_rack?.status === 'open';
  
  // Ambient light from sensor
  const ambientBright = sensors.light?.bright ?? true;
  
  const isRaining = sensors.rain?.raining ?? false;

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <h2 className="font-semibold">Cảm biến & Trạng thái</h2>
      </div>
      
      {/* Sensors grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {/* Gas */}
        <div
          className={cn(
            'rounded-lg p-3 transition-all',
            isGasDanger && 'bg-danger/10 ring-1 ring-danger',
            isGasWarning && !isGasDanger && 'bg-warning/10',
            !isGasWarning && 'bg-muted/50'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Wind 
              className={cn(
                'h-4 w-4',
                isGasDanger ? 'text-danger' : isGasWarning ? 'text-warning' : 'text-muted-foreground'
              )} 
            />
            <span className="text-xs font-medium">Gas</span>
          </div>
          <p className={cn(
            'text-lg sm:text-xl font-bold',
            isGasDanger && 'text-danger',
            isGasWarning && !isGasDanger && 'text-warning'
          )}>
            {gasLevel}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">ppm</span>
          </p>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                gasPercent > 80 ? 'bg-danger' : gasPercent > 50 ? 'bg-warning' : 'bg-success'
              )}
              style={{ width: `${gasPercent}%` }}
            />
          </div>
        </div>

        {/* Fire */}
        <div
          className={cn(
            'rounded-lg p-3 transition-all',
            fireDetected ? 'bg-danger/10 ring-1 ring-danger' : 'bg-muted/50'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Flame 
              className={cn(
                'h-4 w-4',
                fireDetected ? 'text-danger animate-bounce' : 'text-muted-foreground'
              )} 
            />
            <span className="text-xs font-medium">Lửa</span>
          </div>
          <p className={cn('text-sm sm:text-base font-bold', fireDetected && 'text-danger')}>
            {fireDetected ? 'PHÁT HIỆN!' : 'An toàn'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Giá trị: {sensors.fire?.value ?? '--'}
          </p>
        </div>

        {/* Ambient Light Sensor */}
        <div className={cn(
          'rounded-lg p-3 transition-all bg-muted/50'
        )}>
          <div className="flex items-center gap-1.5 mb-1">
            {ambientBright ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
            <span className="text-xs font-medium">Ánh sáng</span>
          </div>
          <p className="text-sm sm:text-base font-bold">
            {ambientBright ? 'Sáng' : 'Tối'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cảm biến môi trường
          </p>
        </div>

        {/* Rain */}
        <div
          className={cn(
            'rounded-lg p-3 transition-all',
            isRaining ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/50'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {isRaining ? (
              <CloudRain className="h-4 w-4 text-primary" />
            ) : (
              <CloudSun className="h-4 w-4 text-warning" />
            )}
            <span className="text-xs font-medium">Thời tiết</span>
          </div>
          <p className={cn(
            'text-sm sm:text-base font-bold',
            isRaining && 'text-primary'
          )}>
            {isRaining ? 'Có mưa' : 'Khô ráo'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRaining ? 'Nên thu đồ' : 'Phơi được'}
          </p>
        </div>

        {/* Dryer Rack Status */}
        <div
          className={cn(
            'rounded-lg p-3 transition-all',
            dryerRackOpen ? 'bg-success/10' : 'bg-muted/50',
            dryerRackOpen && isRaining && 'bg-warning/10 ring-1 ring-warning'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Shirt 
              className={cn(
                'h-4 w-4',
                dryerRackOpen && isRaining ? 'text-warning' : dryerRackOpen ? 'text-success' : 'text-muted-foreground'
              )} 
            />
            <span className="text-xs font-medium">Giàn phơi</span>
          </div>
          <p className={cn(
            'text-sm sm:text-base font-bold',
            dryerRackOpen && isRaining ? 'text-warning' : dryerRackOpen && 'text-success'
          )}>
            {dryerRackOpen ? 'Đang mở' : 'Đã thu'}
          </p>
          <p className={cn(
            'text-xs mt-0.5',
            dryerRackOpen && isRaining ? 'text-warning font-medium' : 'text-muted-foreground'
          )}>
            {dryerRackOpen && isRaining ? '⚠️ Có mưa!' : dryerRackOpen ? 'Đang phơi' : 'Sẵn sàng'}
          </p>
        </div>
      </div>
    </div>
  );
}
