'use client';

import { useState } from 'react';
import { Wifi, WifiOff, Power, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceConfig, DeviceState } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface NeoPixelCardProps {
  config: DeviceConfig;
  state: DeviceState;
  onControl: (action: 'on' | 'off', color?: string) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  { name: 'Đỏ', hex: '#FF0000' },
  { name: 'Xanh lá', hex: '#00FF00' },
  { name: 'Xanh dương', hex: '#0000FF' },
  { name: 'Vàng', hex: '#FFFF00' },
  { name: 'Tím', hex: '#FF00FF' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Trắng', hex: '#FFFFFF' },
];

export function NeoPixelCard({
  config,
  state,
  onControl,
  disabled = false,
}: NeoPixelCardProps) {
  const [confirmAction, setConfirmAction] = useState<'on' | 'off' | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(state.color || '#FFFFFF');

  const isOn = state.status === 'on';
  const isOnline = state.online;
  const isDisabled = disabled || !isOnline;

  const handleToggle = () => {
    if (isOn) {
      setConfirmAction('off');
    } else {
      setShowColorPicker(true);
    }
  };

  const handleConfirm = () => {
    if (confirmAction === 'off') {
      console.log('NeoPixel: turning off');
      onControl('off');
    }
    setConfirmAction(null);
  };

  const handleColorSelect = (color: string) => {
    console.log('NeoPixel: selecting color', color);
    setSelectedColor(color);
    onControl('on', color);
    setShowColorPicker(false);
  };

  const currentColor = state.color || '#FFFFFF';

  return (
    <>
      <div
        className={cn(
          'relative rounded-xl border bg-card p-3 transition-all',
          'hover:shadow-md hover:border-primary/30',
          isOn && 'ring-1 ring-primary/20 bg-primary/5',
          isDisabled && 'opacity-60'
        )}
      >
        {/* Online indicator */}
        <div className="absolute top-2 right-2">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-success" />
          ) : (
            <WifiOff className="h-3 w-3 text-danger" />
          )}
        </div>

        {/* Icon and name */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
              isOn ? 'scale-105' : 'bg-muted'
            )}
            style={isOn ? { backgroundColor: `${currentColor}20` } : undefined}
          >
            <Palette 
              className={cn('h-4 w-4 sm:h-5 sm:w-5 transition-colors')}
              style={isOn ? { color: currentColor } : undefined}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs sm:text-sm truncate">{config.nameVi}</h3>
          </div>
        </div>

        {/* Color preview when on */}
        {isOn && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-xs text-muted-foreground">
              {PRESET_COLORS.find(c => c.hex === currentColor)?.name || 'Tùy chỉnh'}
            </span>
          </div>
        )}

        {/* Status and control */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              isOn && 'bg-success/10 text-success',
              !isOn && 'bg-muted text-muted-foreground'
            )}
          >
            {isOn ? 'Bật' : 'Tắt'}
          </span>

          <div className="flex gap-1">
            {isOn && (
              <button
                onClick={() => setShowColorPicker(true)}
                disabled={isDisabled}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                  'bg-muted hover:bg-muted/80',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
                title="Đổi màu"
              >
                <Palette className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleToggle}
              disabled={isDisabled}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isOn && 'bg-primary text-white',
                !isOn && 'bg-muted hover:bg-muted/80'
              )}
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowColorPicker(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <h3 className="text-lg font-semibold mb-4">Chọn màu đèn</h3>
            
            {/* Preset colors */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => handleColorSelect(color.hex)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                    'hover:bg-muted',
                    selectedColor === color.hex && 'ring-2 ring-primary'
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-full border-2 border-border shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs">{color.name}</span>
                </button>
              ))}
            </div>

            {/* Custom color picker */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                Màu tùy chỉnh
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="h-10 w-16 rounded-lg cursor-pointer border-0"
                />
                <button
                  onClick={() => handleColorSelect(selectedColor)}
                  className="flex-1 rounded-lg bg-primary text-white px-4 py-2 font-medium hover:bg-primary/90 transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowColorPicker(false)}
              className="w-full rounded-lg bg-muted px-4 py-2 font-medium hover:bg-muted/80 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        deviceName={config.nameVi}
        action={confirmAction || 'off'}
      />
    </>
  );
}
