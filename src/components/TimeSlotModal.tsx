import { useState } from 'react';
import { X, Clock, MapPin, Droplets, CheckCircle } from 'lucide-react';
import { api } from '../api';

interface BloodRequest {
  id: number;
  hospital_name: string;
  hospital_address: string;
  blood_type: string;
  amount_ml: number;
  urgency: string;
  note?: string;
  expected_date?: string;
  expiration_date?: string;
  time_slot?: string;
}

interface TimeSlotModalProps {
  request: BloodRequest;
  donorId: number;
  onClose: () => void;
  onSuccess: () => void;
}



export function TimeSlotModal({ request, donorId, onClose, onSuccess }: TimeSlotModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/blood-requests/${request.id}/register`, {
        donor_id: donorId,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const urgencyColor =
    request.urgency === 'Khẩn cấp'
      ? 'bg-red-600'
      : request.urgency === 'Cần gấp'
      ? 'bg-orange-500'
      : 'bg-green-500';

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: '430px',
          padding: '24px 20px 36px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Xác nhận tham gia</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={22} color="#666" />
          </button>
        </div>

        {/* Request info */}
        <div style={{ backgroundColor: '#FBF2E1', borderRadius: 16, padding: '16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 28, fontWeight: 800, color: '#8B0000', lineHeight: 1,
            }}>{request.blood_type}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#fff', backgroundColor: '#8B0000',
              borderRadius: 20, padding: '3px 10px',
            }}>{request.urgency}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
            <MapPin size={14} color="#8B0000" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{request.hospital_name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{request.hospital_address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Droplets size={14} color="#8B0000" />
            <span style={{ fontSize: 13, color: '#555' }}>Cần <strong>{request.amount_ml}ml</strong> máu</span>
          </div>
          {request.note ? (
            <div style={{ fontSize: 12, color: '#777', marginTop: 8, fontStyle: 'italic' }}>
              📝 {request.note}
            </div>
          ) : null}
        </div>

        {success ? (
          /* Thành công */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={56} color="#22c55e" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>
              Đăng ký thành công!
            </div>
            <div style={{ fontSize: 13, color: '#555' }}>
              Bệnh viện sẽ ưu tiên đón tiếp bạn theo khung giờ: <strong>{request.time_slot || 'Liên hệ sau'}</strong>.<br />
              Cảm ơn bạn đã đồng hành cùng Giọt Ấm 💖 (+10 điểm)
            </div>
          </div>
        ) : (
          <>
            {/* Thông tin giờ */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Clock size={16} color="#8B0000" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Khung giờ của bệnh viện</span>
              </div>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.5, backgroundColor: '#f9fafb', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                Bệnh viện đã yêu cầu tình nguyện viên đến vào thời gian: 
                <div style={{ marginTop: 8, fontWeight: 'bold', color: '#8B0000' }}>
                   📅 Bắt đầu: {request.expected_date || 'Chưa rõ'} <br/>
                   {request.expiration_date && (
                     <>⏳ Hết hạn: {new Date(request.expiration_date).toLocaleDateString('vi-VN')} <br/></>
                   )}
                   🕒 {request.time_slot || 'Chưa định khung giờ'}
                </div>
                <div style={{ marginTop: 8, fontStyle: 'italic', fontSize: 13, color: '#666' }}>
                  Bạn đồng ý tham gia thay vì chọn thời gian biểu cá nhân?
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, marginBottom: 14,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Nút xác nhận */}
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: '#8B0000',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '14px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {isLoading ? 'Đang gửi...' : 'Xác nhận tham gia'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
