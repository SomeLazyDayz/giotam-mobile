import { X, AlertCircle, CalendarClock, ChevronRight } from 'lucide-react';

interface BloodRequest {
  id: number;
  hospital_name: string;
  blood_type: string;
  amount_ml: number;
  urgency: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: BloodRequest[];
  onNavigate: (page: string) => void;
}

export function NotificationsModal({ isOpen, onClose, notifications, onNavigate }: NotificationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <h2 className="text-xl font-bold text-foreground">Thông báo</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
          {notifications.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Không có thông báo mới</h3>
              <p className="text-sm text-muted-foreground">Hiện tại không có lời kêu gọi hiến máu nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((req) => {
                const isEmergency = req.urgency === 'Khẩn cấp' || req.urgency === 'Cần gấp';
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      onNavigate('register-donation');
                      onClose();
                    }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-border flex gap-4 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isEmergency ? 'bg-red-100' : 'bg-blue-100'}`}>
                      {isEmergency ? (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      ) : (
                        <CalendarClock className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    
                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-[15px] mb-1 leading-tight ${isEmergency ? 'text-red-700' : 'text-blue-700'}`}>
                        {isEmergency ? 'Bệnh viện đang cần máu khẩn cấp!' : 'Lịch hiến máu thường xuyên mở đăng ký'}
                      </h4>
                      <p className="text-sm text-foreground/80 line-clamp-2 leading-snug">
                        {req.hospital_name} đang cần {req.amount_ml}ml nhóm máu <span className="font-bold text-destructive">{req.blood_type}</span>.
                      </p>
                      <div className="text-xs text-muted-foreground mt-2 font-medium">Nhấn để xem chi tiết & đăng ký</div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex items-center justify-center shrink-0">
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
