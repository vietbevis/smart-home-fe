'use client';

import { useState, useEffect } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, Loader2, ShieldAlert, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface RfidCardInfo {
  hasCard: boolean;
  card: {
    id: number;
    uid: string;
    status: string;
    createdAt: string;
  } | null;
}

export function MyRfidCard() {
  const [cardInfo, setCardInfo] = useState<RfidCardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCardInfo = async () => {
    try {
      const data = await api.getMyRfidCard();
      setCardInfo(data);
    } catch (error) {
      console.error('Failed to fetch RFID card info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardInfo();
  }, []);

  const handleReportLost = async () => {
    setReporting(true);
    setMessage(null);
    
    try {
      const result = await api.reportLostCard();
      setMessage({ type: 'success', text: result.message });
      setShowConfirm(false);
      // Refresh card info
      await fetchCardInfo();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Không thể báo mất thẻ' 
      });
    } finally {
      setReporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Thẻ RFID của tôi</h3>
          <p className="text-xs text-muted-foreground">Quản lý thẻ ra vào</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Messages */}
        {message && (
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-xl mb-4 animate-in slide-in-from-top',
            message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="text-sm flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {cardInfo?.hasCard && cardInfo.card ? (
          <div className="space-y-4">
            {/* Card Info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-success/5 border border-success/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-success">Thẻ đang hoạt động</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {cardInfo.card.uid.substring(0, 8)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  Đăng ký: {formatDate(cardInfo.card.createdAt)}
                </p>
              </div>
            </div>

            {/* Report Lost Button */}
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 font-medium transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              Báo mất thẻ
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Nếu bạn mất thẻ, hãy báo ngay để vô hiệu hóa và ngăn truy cập trái phép.
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">Chưa có thẻ RFID</p>
            <p className="text-sm text-muted-foreground">
              Liên hệ quản trị viên để được cấp thẻ ra vào.
            </p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                <ShieldAlert className="h-7 w-7 text-danger" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">Xác nhận báo mất thẻ?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Thẻ RFID của bạn sẽ bị vô hiệu hóa ngay lập tức. 
              Bạn sẽ cần liên hệ quản trị viên để được cấp thẻ mới.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={reporting}
                className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReportLost}
                disabled={reporting}
                className="flex-1 py-3 rounded-xl bg-danger text-white hover:bg-danger/90 font-medium transition-colors disabled:opacity-50"
              >
                {reporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
