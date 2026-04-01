import { useState, useEffect } from 'react';
import { Users, Hospital, TrendingUp, LogOut, CheckCircle, Search, Droplet, Phone, MapPin, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

interface AdminDashboardProps {
  onLogout: () => void;
  userRole?: string;
}

interface PendingRecord {
  record_id: number;
  user_name: string;
  phone: string;
  blood_type: string;
  donation_date: string;
}

export function AdminDashboard({ onLogout, userRole = 'admin' }: AdminDashboardProps) {
  const [stats, setStats] = useState({ users: 0, hospitals: 0, accepted: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([]);
  const [scheduledRecords, setScheduledRecords] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [confirmType, setConfirmType] = useState<'emergency'|'scheduled'>('emergency');
  const [amountMl, setAmountMl] = useState('350');
  const [donationType, setDonationType] = useState('Toàn phần');
  const [donationDate, setDonationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [toastMessage, setToastMessage] = useState('');

  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);

  // Search TNV States
  const [filters, setFilters] = useState({ bloodType: 'O+', radius: '10', donationType: 'Toàn phần' });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedDonors, setSelectedDonors] = useState<number[]>([]);

  const fetchPendingDonations = async () => {
    setIsLoadingPending(true);
    try {
      const pendingRes = await api.get('/admin/pending_donations');
      setPendingRecords(pendingRes.data.pending_donations || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách pending:', error);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const fetchScheduledRegistrations = async () => {
    setIsLoadingScheduled(true);
    try {
      const scheduledRes = await api.get('/admin/scheduled_registrations');
      setScheduledRecords(scheduledRes.data.scheduled_registrations || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách hiến máu thường xuyên:', error);
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  useEffect(() => {
    // In a real app we'd fetch this from the backend
    // For now, we will mock the chart data and try to fetch summary counts
    const fetchStats = async () => {
      try {
        const userRes = await api.get('/users');
        const hospitalRes = await api.get('/hospitals');
        const donorGrowthRes = await api.get('/admin/donor_growth');
        const totalUsers = userRes.data.count || 0;
        const totalHospitals = hospitalRes.data.count || 0;
        setStats({ users: totalUsers, hospitals: totalHospitals, accepted: 0 });

        if (donorGrowthRes.data?.chart_data) {
          setChartData(donorGrowthRes.data.chart_data);
        } else {
          setChartData([
            { name: 'T1', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
            { name: 'T2', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
            { name: 'T3', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
            { name: 'T4', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching admin stats', error);
        setStats({ users: 0, hospitals: 0, accepted: 0 });
        setChartData([
          { name: 'T1', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
          { name: 'T2', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
          { name: 'T3', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
          { name: 'T4', 'Toàn phần': 0, 'Tiểu cầu': 0, 'Huyết tương': 0 },
        ]);
      }
    };

    fetchStats();
    fetchPendingDonations();
    fetchScheduledRegistrations();
  }, []);

  const handleOpenConfirm = (recordId: number, type: 'emergency'|'scheduled' = 'emergency', defaultAmountMl: string = '350') => {
    setSelectedRecordId(recordId);
    setConfirmType(type);
    setAmountMl(defaultAmountMl);
    setDonationType('Toàn phần');
    setDonationDate(new Date().toISOString().split('T')[0]);
    setShowConfirmModal(true);
  };

  const handleCancelEmergency = async (recordId: number) => {
    if (!window.confirm('Xóa bản ghi Khẩn Cấp này khỏi danh sách (Do tình nguyện viên không đến)?')) return;
    try {
      await api.delete(`/admin/cancel_emergency_donation/${recordId}`);
      fetchPendingDonations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi xóa bản ghi khẩn cấp');
    }
  };

  const handleCancelScheduled = async (regId: number) => {
    if (!window.confirm('Xóa lượt Đăng Ký hẹn trước này khỏi danh sách (Do tình nguyện viên không đến)?')) return;
    try {
      await api.delete(`/admin/cancel_scheduled_registration/${regId}`);
      fetchScheduledRegistrations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi hủy đăng ký thường xuyên');
    }
  };

  const handleConfirmDonation = async () => {
    if (!selectedRecordId) return;
    try {
      const payload = {
        amount_ml: parseInt(amountMl, 10),
        donation_type: donationType,
        donation_date: donationDate
      };
      
      if (confirmType === 'emergency') {
        await api.post(`/admin/confirm_donation/${selectedRecordId}`, payload);
      } else {
        await api.post(`/admin/confirm_scheduled_donation/${selectedRecordId}`, payload);
      }
      
      setShowConfirmModal(false);
      setToastMessage('Ghi nhận thành công');
      setTimeout(() => setToastMessage(''), 3000);

      // Refresh corresponding list
      if (confirmType === 'emergency') {
        fetchPendingDonations();
      } else {
        fetchScheduledRegistrations();
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận hiến máu:', error);
      alert('Có lỗi xảy ra khi xác nhận!');
    }
  };

  // Logic Tìm Kiếm TNV
  const handleSearchDonors = async () => {
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedDonors([]);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const hospitalId = user?.id || 1;

      const searchPayload = {
        hospital_id: hospitalId,
        blood_type: filters.bloodType,
        radius_km: parseInt(filters.radius, 10),
        donation_type: filters.donationType
      };

      const response = await api.post('/create_alert', searchPayload);
      const result = response.data;

      setSearchResults(result.top_50_users || []);
      if (!result.top_50_users || result.top_50_users.length === 0) {
        setToastMessage("Không tìm thấy người phù hợp.");
        setTimeout(() => setToastMessage(''), 3000);
      } else {
        setToastMessage(`Tìm thấy ${result.top_50_users.length} TNV.`);
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (error: any) {
      setSearchError(`Lỗi tìm kiếm: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDonor = (donorId: number) => {
    setSelectedDonors(prev => {
      if (prev.includes(donorId)) return prev.filter(id => id !== donorId);
      return [...prev, donorId];
    });
  };

  const handleSelectAll = () => {
    const eligibleIds = searchResults.filter(r => r.is_eligible !== false).map(r => r.user.id);
    if (selectedDonors.length === eligibleIds.length && eligibleIds.length > 0) {
      setSelectedDonors([]);
    } else {
      setSelectedDonors(eligibleIds);
    }
  };

  const handleBulkContact = async () => {
    if (selectedDonors.length === 0) {
      setToastMessage("Vui lòng chọn ít nhất một người");
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    setIsSearching(true);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const hospitalName = user?.name || "Bệnh viện";
    const hospitalAddress = user?.address || "địa chỉ hiển thị trên trang chủ";
    const bloodTypeNeeded = filters.bloodType;
    const donationTypeNeeded = filters.donationType;

    const messageBody = `[GIOT AM] KHẨN CẤP! Bệnh viện ${hospitalName} đang cần gấp ${donationTypeNeeded} nhóm máu ${bloodTypeNeeded}. Xin vui lòng hiến máu tại: ${hospitalAddress}. Trân trọng cảm ơn!`;

    try {
      const response = await api.post('/notify_donors', {
        hospital_id: user?.id || 1,
        blood_type: bloodTypeNeeded,
        donation_type: donationTypeNeeded,
        donor_ids: selectedDonors,
        message: messageBody
      });
      const result = response.data;

      setToastMessage(result.message || 'Đã gửi yêu cầu.');
      setTimeout(() => setToastMessage(''), 3000);
      setSelectedDonors([]);
    } catch (error: any) {
      setSearchError(`Gửi thông báo thất bại: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };  return (
    <div className="min-h-full bg-background pb-24 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg animate-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-destructive px-6 pt-12 pb-6 rounded-b-[40px] shadow-lg sticky top-0 z-10 w-[393px]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Bảng Điều Khiển
          </h1>
          <button onClick={onLogout} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-white/80 mt-2 text-sm">
          Quản lý hệ thống Giọt Ấm
        </p>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center border border-muted">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-destructive" />
            </div>
            <div className="text-xl font-bold text-foreground">{stats.users}</div>
            <div className="text-[10px] text-muted-foreground mt-1 text-center">Tình nguyện viên</div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center border border-muted">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Hospital className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-foreground">{stats.hospitals}</div>
            <div className="text-[10px] text-muted-foreground mt-1 text-center">Bệnh viện</div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center border border-primary/20">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-xl font-bold text-foreground">{pendingRecords.length}</div>
            <div className="text-[10px] text-muted-foreground mt-1 text-center font-bold text-green-600">Ca chờ hiến</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-card rounded-3xl p-6 shadow-lg border border-muted">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-bold text-foreground">Tăng trưởng người hiến</h2>
          </div>

          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Toàn phần" stackId="a" fill="#930511" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="Tiểu cầu" stackId="a" fill="#e07070" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="Huyết tương" stackId="a" fill="#f5c6c6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Bệnh viện Tìm kiếm TNV */}
        {userRole === 'hospital' && (
          <div className="bg-[#FBF2E1] rounded-3xl p-6 shadow-lg border border-[#e5d5b7] mt-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Tìm kiếm Tình nguyện viên Khẩn cấp</h2>
            <p className="text-xs text-muted-foreground mb-4">Gửi thông báo khẩn cấp tới những tình nguyện viên phù hợp xung quanh theo bán kính.</p>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <select 
                  className="w-full h-10 bg-white border border-border rounded-lg px-2 text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
                  value={filters.bloodType}
                  onChange={(e) => setFilters(prev => ({...prev, bloodType: e.target.value}))}
                >
                  <option value="O+">Nhóm O+</option>
                  <option value="O-">Nhóm O-</option>
                  <option value="A+">Nhóm A+</option>
                  <option value="A-">Nhóm A-</option>
                  <option value="B+">Nhóm B+</option>
                  <option value="B-">Nhóm B-</option>
                  <option value="AB+">Nhóm AB+</option>
                  <option value="AB-">Nhóm AB-</option>
                </select>
              </div>
              <div className="flex-1">
                <select 
                  className="w-full h-10 bg-white border border-border rounded-lg px-2 text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
                  value={filters.donationType}
                  onChange={(e) => setFilters(prev => ({...prev, donationType: e.target.value}))}
                >
                  <option value="Toàn phần">Toàn phần</option>
                  <option value="Tiểu cầu">Tiểu cầu</option>
                  <option value="Huyết tương">H.tương</option>
                </select>
              </div>
              <div className="w-[75px]">
                <select 
                  className="w-full h-10 bg-white border border-border rounded-lg px-2 text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
                  value={filters.radius}
                  onChange={(e) => setFilters(prev => ({...prev, radius: e.target.value}))}
                >
                  {[3, 5, 10, 15, 20].map(r => <option key={r} value={r}>{r}km</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSearchDonors} disabled={isSearching}
              className="w-full bg-destructive text-white h-10 rounded-lg text-sm font-bold flex items-center justify-center disabled:opacity-70"
            >
              <Search className="w-4 h-4 mr-2" /> {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>

            {searchError && <p className="text-xs text-red-600 mt-2 text-center">{searchError}</p>}

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 border-t border-[#e5d5b7] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded accent-destructive" checked={selectedDonors.length > 0 && selectedDonors.length === searchResults.filter(r => r.is_eligible !== false).length} onChange={handleSelectAll} />
                    <span>Chọn tất cả ({selectedDonors.length}/{searchResults.filter(r => r.is_eligible !== false).length})</span>
                  </label>
                  <button onClick={handleBulkContact} disabled={isSearching || selectedDonors.length === 0} className="bg-destructive text-white text-sm px-4 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center">
                    <Send className="w-4 h-4 mr-1.5" /> Gửi
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {searchResults.map(result => {
                    const isEligible = result.is_eligible !== false;
                    const recoveryDays = result.recovery_days_left || 0;
                    return (
                    <label key={result.user.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDonors.includes(result.user.id) ? 'bg-[#fbe4e6] border-destructive' : 'bg-white border-transparent hover:bg-white/60'} ${!isEligible ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      <input type="checkbox" disabled={!isEligible} className="w-4 h-4 rounded accent-destructive shrink-0" checked={selectedDonors.includes(result.user.id)} onChange={() => handleSelectDonor(result.user.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`font-bold text-sm truncate ${!isEligible ? 'text-gray-500' : 'text-foreground'}`}>{result.user.name}</h4>
                          <span className={`${!isEligible ? 'bg-gray-200 text-gray-500' : 'bg-destructive/10 text-destructive'} text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center shrink-0`}>
                            <Droplet className="w-2.5 h-2.5 mr-0.5" /> {result.user.blood_type}
                          </span>
                          {!isEligible && (
                            <span className="bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex shrink-0">
                              Đợi {recoveryDays} ngày
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {result.user.phone}</span>
                          <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {result.distance_km.toFixed(1)} km</span>
                          {!isEligible && <span className="flex items-center text-[10px]">&bull; (Điểm: {result.ai_score.toFixed(2)})</span>}
                        </div>
                      </div>
                    </label>
                  )})}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Donations (Emergency) */}
        <div className="bg-card rounded-3xl p-6 shadow-lg border border-muted mt-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">🚨 Hiến máu khẩn cấp</h2>
            <button
              onClick={fetchPendingDonations}
              disabled={isLoadingPending}
              style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '5px 12px', fontSize: 12, color: '#6b7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {isLoadingPending ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
          <div className="space-y-3">
            {pendingRecords.length === 0 && scheduledRecords.filter((r: any) => r.urgency === 'Khẩn cấp').length === 0 ? (
              <div className="text-center py-6 text-foreground/60 italic border border-dashed border-muted rounded-2xl">Không có người chờ hiến máu khẩn cấp</div>
            ) : (
              <>
              {pendingRecords.map((record) => (
                <div key={record.record_id} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>{record.user_name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#777', marginTop: 4 }}>
                        <Phone style={{ width: 12, height: 12, marginRight: 4 }}/> {record.phone}
                      </span>
                    </div>
                    <span style={{ background: '#fde8e8', color: '#8B0000', fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Droplet style={{ width: 12, height: 12 }} /> {record.blood_type || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCancelEmergency(record.record_id)}
                      style={{ flex: 1, background: '#fff5f5', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✕ Vắng mặt
                    </button>
                    <button
                      onClick={() => handleOpenConfirm(record.record_id, 'emergency')}
                      style={{ flex: 2, background: '#10b981', color: '#fff', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                    >
                      <CheckCircle style={{ width: 15, height: 15 }} /> Xác nhận hoàn tất
                    </button>
                  </div>
                </div>
              ))}
              {scheduledRecords.filter((r: any) => r.urgency === 'Khẩn cấp').map((record: any) => (
                <div key={`emg-${record.reg_id}`} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #fca5a5', boxShadow: '0 1px 4px rgba(220,38,38,0.1)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>{record.user_name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#777', marginTop: 4 }}>
                        <Phone style={{ width: 12, height: 12, marginRight: 4 }}/> {record.phone}
                      </span>
                    </div>
                    <span style={{ background: '#fde8e8', color: '#8B0000', fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Droplet style={{ width: 12, height: 12 }} /> {record.blood_type || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCancelEmergency(record.reg_id)}
                      style={{ flex: 1, background: '#fff5f5', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✕ Vắng mặt
                    </button>
                    <button
                      onClick={() => handleOpenConfirm(record.reg_id, 'scheduled', String(record.amount_ml || '350'))}
                      style={{ flex: 2, background: '#10b981', color: '#fff', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                    >
                      <CheckCircle style={{ width: 15, height: 15 }} /> Xác nhận hoàn tất
                    </button>
                  </div>
                </div>
              ))}
              </>
            )}
          </div>
        </div>

        {/* Scheduled Donations */}
        <div className="bg-card rounded-3xl p-6 shadow-lg border border-muted mt-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">📅 Hiến máu thường xuyên</h2>
            <button
              onClick={fetchScheduledRegistrations}
              disabled={isLoadingScheduled}
              style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '5px 12px', fontSize: 12, color: '#6b7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {isLoadingScheduled ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
          <div className="space-y-3">
            {scheduledRecords.filter((r: any) => r.urgency !== 'Khẩn cấp').length === 0 ? (
              <div className="text-center py-6 text-foreground/60 italic border border-dashed border-muted rounded-2xl">Không có người đăng ký hiến máu thường xuyên</div>
            ) : (
              scheduledRecords.filter((r: any) => r.urgency !== 'Khẩn cấp').map((record: any) => (
                <div key={record.reg_id} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex justify-between items-center">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>{record.user_name}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#777' }}><Phone style={{ width: 12, height: 12, marginRight: 4 }}/> {record.phone}</span>
                        {record.time_slot && <span style={{ fontSize: 12, color: '#777' }}>🕒 {record.time_slot}</span>}
                        {record.expected_date && <span style={{ fontSize: 12, color: '#777' }}>📅 {record.expected_date}</span>}
                      </div>
                    </div>
                    <span style={{ background: '#fde8e8', color: '#8B0000', fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                      <Droplet style={{ width: 12, height: 12 }} /> {record.blood_type || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCancelScheduled(record.reg_id)}
                      style={{ flex: 1, background: '#fff5f5', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✕ Vắng mặt
                    </button>
                    <button
                      onClick={() => handleOpenConfirm(record.reg_id, 'scheduled', String(record.amount_ml || '350'))}
                      style={{ flex: 2, background: '#10b981', color: '#fff', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}
                    >
                      <CheckCircle style={{ width: 15, height: 15 }} /> Xác nhận hoàn tất
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">Xác nhận hiến máu</h3>
            <p className="text-sm text-muted-foreground mb-6">Vui lòng nhập dung tích máu thực tế (ml)</p>

            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Loại hiến máu</label>
                <select
                  value={donationType}
                  onChange={(e) => setDonationType(e.target.value)}
                  className="w-full h-12 bg-muted/50 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all"
                >
                  <option value="Toàn phần">Máu Toàn phần</option>
                  <option value="Tiểu cầu">Tiểu cầu</option>
                  <option value="Huyết tương">Huyết tương</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ngày hiến máu</label>
                <input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full h-12 bg-muted/50 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Chọn mức thể tích</label>
                <div className="flex gap-2">
                  <button onClick={() => setAmountMl('250')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${amountMl === '250' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-foreground hover:bg-muted'}`}>250 ml</button>
                  <button onClick={() => setAmountMl('350')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${amountMl === '350' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-foreground hover:bg-muted'}`}>350 ml</button>
                  <button onClick={() => setAmountMl('450')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${amountMl === '450' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-foreground hover:bg-muted'}`}>450 ml</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hoặc nhập dung tích khác (ml)</label>
                <input
                  type="number"
                  value={amountMl}
                  onChange={(e) => setAmountMl(e.target.value)}
                  className="w-full h-12 bg-muted/50 border border-border rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDonation}
                className="flex-1 py-3 bg-destructive text-white font-bold rounded-xl hover:bg-destructive/90 transition-colors shadow-lg shadow-destructive/30"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
