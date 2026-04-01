import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../api';
import { NotificationsModal } from './NotificationsModal';

interface HeaderProps {
  onMenuClick: () => void;
  onNavigate?: (page: string) => void;
}

export function Header({ onMenuClick, onNavigate }: HeaderProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/blood-requests');
        if (res.data?.blood_requests) {
          const currentUserStr = localStorage.getItem('user');
          let myBloodType = 'Khác';
          if (currentUserStr) {
            try {
              const u = JSON.parse(currentUserStr);
              myBloodType = u.blood_type || 'Khác';
            } catch(e) {}
          }
          const reqs = res.data.blood_requests.filter((r: any) => 
            myBloodType === 'Khác' || r.blood_type === 'Khác' || r.blood_type === myBloodType
          );
          setNotifications(reqs);

          // Get read notification IDs from local storage
          const readIdsStr = localStorage.getItem('read_notifications');
          let readIds: number[] = [];
          if (readIdsStr) {
            try {
              readIds = JSON.parse(readIdsStr);
            } catch (e) {}
          }
          
          // Calculate unread count
          const unread = reqs.filter((req: any) => !readIds.includes(req.id)).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
    // Setting up polling every minute to ensure fresh notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenNotifications = () => {
    setIsModalOpen(true);
    // Mark all as read
    const allIds = notifications.map(req => req.id);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
    setUnreadCount(0);
  };

  return (
    <>
      <div className="bg-destructive text-destructive-foreground px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2" onClick={onMenuClick}>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center relative cursor-pointer hover:bg-gray-100 transition-colors">
             <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C10 0 0 8 0 14C0 19.5228 4.47715 24 10 24C15.5228 24 20 19.5228 20 14C20 8 10 0 10 0Z" fill="#930510"/>
            </svg>
          </div>
          <span className="font-bold text-xl">Giọt Ấm</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenNotifications}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-destructive shadow-sm animate-pulse" />
            )}
          </button>
        </div>
      </div>
      
      <NotificationsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notifications={notifications}
        onNavigate={onNavigate || (() => {})}
      />
    </>
  );
}