import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    
    // Detect if already installed (standalone mode)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    setIsIOS(isIOSDevice && isSafari);
    setIsStandalone(isInStandaloneMode);

    // Show prompt only if on iOS, not installed, and not dismissed recently
    if (isIOSDevice && isSafari && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa_prompt_dismissed', new Date().getTime().toString());
  };

  if (!showPrompt || isStandalone || !isIOS) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-8 pt-4 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl border-t border-gray-100 flex flex-col items-center">
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"
      >
        <X size={18} />
      </button>

      <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
        <img src="/logo.png" alt="Giọt Ấm" className="w-10 h-10 object-contain" />
      </div>

      <h3 className="text-[17px] font-bold text-gray-900 mb-2 text-center">Cài đặt Ứng dụng Giọt Ấm</h3>
      <p className="text-[14px] text-gray-600 text-center mb-6 leading-relaxed max-w-[280px]">
        Thêm ứng dụng vào màn hình chính để trải nghiệm mượt mà và nhận thông báo khẩn cấp.
      </p>

      <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#007AFF] font-medium text-xs border border-gray-100 shrink-0">1</div>
          <div className="text-[14px] text-gray-700 font-medium flex items-center gap-2">
            Nhấn thanh biểu tượng <Share size={18} className="text-[#007AFF] stroke-[2.5]" /> ở dưới
          </div>
        </div>
        
        <div className="w-0.5 h-6 bg-gray-200 absolute left-[30px] top-[40px]"></div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#007AFF] font-medium text-xs border border-gray-100 shrink-0">2</div>
          <div className="text-[14px] text-gray-700 font-medium flex items-center gap-2">
            Chọn <div className="bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm flex items-center gap-1.5 font-semibold text-[13px]"><PlusSquare size={14} className="text-gray-900"/> Thêm vào MH chính</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 w-12 h-1 bg-gray-200 rounded-full"></div>
    </div>
  );
}
