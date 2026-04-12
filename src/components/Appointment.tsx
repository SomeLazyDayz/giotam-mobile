import { Calendar, MapPin, Clock, ChevronRight, ChevronDown, AlertCircle, Info, Droplet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { PageHeader } from './PageHeader';
import { api } from '../api';
import { toast } from 'sonner';

function CountdownTimer({ createdAt, onExpire }: { createdAt: string, onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const targetDate = new Date(createdAt).getTime() + 60 * 60 * 1000; // 60 minutes
    const tick = () => {
      const diff = targetDate - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft('Đã hết giờ');
        onExpire();
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}p ${s}s`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onExpire]);
  return <span className="text-[11px] font-bold text-red-600 animate-pulse bg-red-50 px-1 py-0.5 rounded ml-1">⏳ {timeLeft}</span>;
}

interface AppointmentProps {
  hasHealthDeclaration: boolean;
  onNavigateToDeclaration: () => void;
  onBack?: () => void;
}

export function Appointment({ hasHealthDeclaration, onNavigateToDeclaration, onBack }: AppointmentProps) {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [expiredIds, setExpiredIds] = useState<Set<number>>(new Set());

  const handleExpire = (id: number) => {
    setExpiredIds(prev => new Set(prev).add(id));
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const currentUserStr = localStorage.getItem('user');
        let myBloodType = 'Khác';
        let donorId = null;
        if (currentUserStr) {
          try {
            const u = JSON.parse(currentUserStr);
            myBloodType = u.blood_type || 'Khác';
            donorId = u.id;
          } catch(e) {}
        }

        const response = await api.get(donorId ? `/blood-requests?donor_id=${donorId}` : '/blood-requests');
        const formattedLocations = response.data.blood_requests
          .filter((r: any) => (myBloodType === 'Khác' || r.blood_type === 'Khác' || r.blood_type === myBloodType))
          .map((r: any) => ({
          id: r.id,
          name: r.hospital_name || r.hospital_address || 'Bệnh viện',
          bloodType: r.blood_type,
          amountMl: r.amount_ml,
          expirationDate: r.expiration_date,
          urgency: r.urgency,
          donationType: r.donation_type || 'Toàn phần',
          createdAt: r.created_at,
          available: r.status === 'open'
        }));
        setLocations(formattedLocations);
      } catch (error) {
        console.error("Lỗi:", error);
      }
    };
    fetchRequests();
  }, []);



  // Show warning if no health declaration
  if (!hasHealthDeclaration) {
    return (
      <div className="min-h-full bg-background">
        <div className="bg-card rounded-t-[32px] px-4 pt-6 mt-4 min-h-[calc(100vh-140px)]">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-3 text-center">
              Chưa có kê khai sức khỏe
            </h2>
            
            <p className="text-sm text-foreground/70 text-center mb-8 px-6">
              Bạn cần hoàn thành kê khai sức khỏe trước khi đăng ký hiến máu để đảm bảo an toàn cho người hiến và người nhận.
            </p>

            <div className="w-full px-6 space-y-3">
              <button
                onClick={onNavigateToDeclaration}
                className="w-full bg-destructive text-destructive-foreground py-4 rounded-2xl font-bold hover:bg-destructive/90 transition-colors shadow-lg"
              >
                Kê khai sức khỏe ngay
              </button>
              
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
                <h4 className="font-bold text-destructive text-sm mb-2">Lưu ý:</h4>
                <ul className="text-xs text-foreground/70 space-y-1">
                  <li>• Kê khai phải được thực hiện trước mỗi lần hiến máu</li>
                  <li>• Thông tin kê khai giúp đảm bảo chất lượng máu</li>
                  <li>• Mất khoảng 5-10 phút để hoàn thành</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <PageHeader title="Đăng ký hiến máu" onBack={onBack || (() => {})} />
      
      {/* Main Content Card */}
      <div className="px-4 pt-4 pb-20">
        {/* Select Location */}
        <div className="mb-6">
          <label className="text-sm font-bold text-foreground mb-3 block">
            Chọn điểm hiến máu <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            {locations.map((location) => {
              const isExpanded = expandedLocation === location.id;
              const isSelected = selectedLocation === location.id;
              const isAvailable = location.available && !expiredIds.has(location.id);

              return (
                <div
                  key={location.id}
                  className={`rounded-2xl border-2 text-left transition-all overflow-hidden ${
                    isSelected
                      ? 'border-destructive bg-destructive/5'
                      : isAvailable
                      ? 'border-border bg-white'
                      : 'border-border bg-gray-100 opacity-50'
                  }`}
                >
                  {/* Card Header — bấm để chọn */}
                  <button
                    onClick={() => isAvailable && setSelectedLocation(location.id)}
                    disabled={!isAvailable}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-foreground mb-1">
                          {location.name}
                          {location.urgency === 'Khẩn cấp' && <span className="ml-2 text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full uppercase">Khẩn cấp</span>}
                        </div>
                        <div className="text-xs text-foreground/60 flex items-center flex-wrap gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          Cần máu: {location.bloodType} - {location.amountMl}ml
                          {location.urgency === 'Khẩn cấp' ? (
                             location.createdAt && <CountdownTimer createdAt={location.createdAt} onExpire={() => handleExpire(location.id)} />
                          ) : (
                             location.expirationDate && <span> | Hết hạn: {new Date(location.expirationDate).toLocaleDateString('vi-VN')}</span>
                          )}
                        </div>
                      </div>
                      {isAvailable ? (
                        // Nút mũi tên — bấm để mở/đóng chi tiết
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedLocation(isExpanded ? null : location.id);
                          }}
                          className="ml-2 mt-1 p-1 rounded-full hover:bg-black/5 transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-5 h-5 text-destructive" />
                            : <ChevronRight className="w-5 h-5 text-foreground/40" />
                          }
                        </button>
                      ) : (
                        <span className="text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-full mt-2">
                          {expiredIds.has(location.id) ? 'Hết giờ' : 'Đã đầy'}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Chi tiết mở rộng */}
                  {isExpanded && isAvailable && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40">
                      {/* Thông tin hiến máu */}
                      <div className="pt-3">
                        <p className="text-xs font-bold text-foreground/50 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Droplet className="w-3.5 h-3.5" /> Thông tin hiến máu
                        </p>
                        <div className="bg-destructive/5 rounded-xl p-3 space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-foreground/60">Nhóm máu cần:</span>
                            <span className="font-bold text-destructive">{location.bloodType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground/60">Lượng máu:</span>
                            <span className="font-semibold">{location.amountMl} ml</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground/60">Loại hiến:</span>
                            <span className="font-semibold">{location.donationType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground/60">Mức độ:</span>
                            <span className={`font-semibold ${location.urgency === 'Khẩn cấp' ? 'text-red-600' : 'text-green-600'}`}>
                              {location.urgency}
                            </span>
                          </div>
                          {location.expirationDate && (
                            <div className="flex justify-between">
                              <span className="text-foreground/60">Hết hạn:</span>
                              <span className="font-semibold">{new Date(location.expirationDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Thông tin bổ sung */}
                      <div>
                        <p className="text-xs font-bold text-foreground/50 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" /> Thông tin bổ sung
                        </p>
                        <div className="bg-blue-50 rounded-xl p-3 space-y-1 text-xs text-foreground/70">
                          <p>• Uống đủ nước trước khi hiến máu (ít nhất 500ml)</p>
                          <p>• Ăn nhẹ trước khi đến, không để bụng đói</p>
                          <p>• Mang theo CMND/CCCD để làm thủ tục</p>
                          <p>• Thời gian thực hiện khoảng 30–45 phút</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>



        {/* Submit Button */}
        {selectedLocation && (
          <div className="pb-6">
            <Button onClick={async () => {
              try {
                const selectedLoc = locations.find(l => l.id === selectedLocation);
                if (!selectedLoc) return;
          
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                  toast.error('Vui lòng đăng nhập lại');
                  onBack && onBack();
                  return;
                }
                const user = JSON.parse(userStr);
                
                const response = await api.post(`/blood-requests/${selectedLoc.id}/register`, {
                  donor_id: user.id,
                  time_slot: 'Trong ngày (Theo sắp xếp của Bệnh viện)'
                });
          
                toast.success(response.data.message || 'Đăng ký hiến máu thành công!');
                onBack && onBack();
              } catch (error: any) {
                toast.error(error.response?.data?.error || 'Lỗi khi đăng ký hiến máu');
              }
            }} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground py-6 text-base rounded-2xl font-bold shadow-lg">
              Xác nhận đăng ký hiến máu
            </Button>
            <p className="text-xs text-foreground/60 text-center mt-3">
              Bạn sẽ nhận được xác nhận qua SMS và email
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
