import React, { useState, useEffect } from 'react';
import { Property, ConnectionStatus } from './types';
import { 
  fetchPropertyDetails, 
  setNetworkCondition, 
  getServerRegion,
  getLocalLeads,
  clearLocalLeads
} from './services/mockBackend';
import { PropertyView } from './components/PropertyView';
import { LeadForm } from './components/LeadForm';
import { AIConcierge } from './components/AIConcierge';
import { Button, StatusBadge, Icon, Toast } from './components/UI';

const App: React.FC = () => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkStatus, setNetworkStatusState] = useState<ConnectionStatus>(ConnectionStatus.ONLINE);
  const [region, setRegion] = useState(getServerRegion());
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [localLeadsCount, setLocalLeadsCount] = useState(0);
  const [toast, setToast] = useState<{msg: string, type: 'info'|'success'|'warning'|'error'} | null>(null);

  // --- Chaos Engineering Controls ---
  const toggleNetwork = (status: ConnectionStatus) => {
    setNetworkCondition(status);
    setNetworkStatusState(status);
    setRegion(getServerRegion());

    // Notification Logic
    if (status === ConnectionStatus.OFFLINE) {
      setToast({ msg: "Mất kết nối mạng. Đã chuyển sang chế độ Lưu trữ Ngoại tuyến.", type: 'error' });
    } else if (status === ConnectionStatus.DEGRADED) {
      setToast({ msg: "Mạng không ổn định. Đang định tuyến sang Vùng dự phòng (Tokyo).", type: 'warning' });
    } else {
      setToast({ msg: "Đã khôi phục kết nối. Đang sử dụng Vùng máy chủ chính.", type: 'success' });
    }

    // If going online, check queue
    if (status === ConnectionStatus.ONLINE) {
      setTimeout(() => {
        const queue = getLocalLeads();
        if (queue.length > 0) {
           console.log(`Syncing ${queue.length} leads to backend...`);
           clearLocalLeads();
           setLocalLeadsCount(0);
           setToast({ msg: `Đã đồng bộ thành công ${queue.length} khách hàng ngoại tuyến lên CRM.`, type: 'success' });
        }
      }, 1500);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPropertyDetails();
      setProperty(data);
    } catch (error) {
      console.warn("Using Fallback UI due to:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setLocalLeadsCount(getLocalLeads().length);
    const interval = setInterval(() => {
       setLocalLeadsCount(getLocalLeads().length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-surface font-sans text-onSurface selection:bg-primaryContainer selection:text-primary">
      
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* --- Top Bar (Enterprise Header) --- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-surfaceVariant px-4 py-3 flex items-center justify-between shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">R</div>
           <div className="hidden md:block">
              <span className="font-bold text-lg tracking-tight text-gray-900 leading-tight block">ResilienceRE</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Nền tảng Doanh nghiệp</span>
           </div>
        </div>

        {/* Chaos Control Panel (Demo Only) */}
        <div className="hidden lg:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1.5 border border-gray-200">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Icon name="tune" className="text-xs" /> Mô phỏng:
          </span>
          {[ConnectionStatus.ONLINE, ConnectionStatus.DEGRADED, ConnectionStatus.OFFLINE].map(s => (
            <button
              key={s}
              onClick={() => toggleNetwork(s)}
              className={`
                text-[10px] px-3 py-1.5 rounded-full transition-all font-bold uppercase tracking-wide
                ${networkStatus === s 
                  ? 'bg-white shadow-md text-primary transform scale-105' 
                  : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
           {/* Region Indicator - Key Resilience Feature */}
           <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-[10px] text-gray-400 uppercase font-bold">Máy chủ</span>
             <span className={`text-xs font-medium flex items-center gap-1 ${
                region.includes('Tokyo') ? 'text-orange-600' : 
                region.includes('Edge') ? 'text-red-600' : 'text-green-700'
             }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  region.includes('Tokyo') ? 'bg-orange-500' : 
                  region.includes('Edge') ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
                {region}
             </span>
           </div>

           {localLeadsCount > 0 && (
             <div className="flex items-center gap-1 text-xs text-white bg-orange-500 px-3 py-1.5 rounded-full font-bold shadow-sm animate-pulse">
                <Icon name="cloud_off" className="text-sm" />
                <span>{localLeadsCount}</span>
             </div>
           )}
           
           <div className="hidden md:block">
             <StatusBadge status={networkStatus} />
           </div>

           <Button variant="filled" className="!px-5 !py-2 !rounded-xl !text-sm !shadow-md shadow-primary/20" onClick={() => setShowLeadForm(true)}>
             Liên hệ
           </Button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="container mx-auto max-w-6xl md:px-4 md:py-6">
         <PropertyView 
            property={property as Property} 
            loading={loading} 
            networkStatus={networkStatus}
            onRefresh={loadData}
         />
      </main>

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-surfaceVariant mt-12 py-12">
         <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
               <h4 className="font-bold text-gray-900">Resilience Real Estate</h4>
               <p className="text-sm text-gray-500 mt-1">Vận hành với độ sẵn sàng 99.999%</p>
            </div>
            <div className="flex gap-6 text-sm text-gray-500 font-medium">
               <a href="#" className="hover:text-primary">Chính sách riêng tư</a>
               <a href="#" className="hover:text-primary">Điều khoản</a>
               <a href="#" className="hover:text-primary">Cam kết dịch vụ (SLA)</a>
            </div>
         </div>
      </footer>

      {/* --- Bottom Sticky Action (Mobile) --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-surfaceVariant p-4 z-30 flex gap-3 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Button variant="outlined" className="flex-1 !rounded-xl" icon={<Icon name="call" />}>
           Gọi ngay
        </Button>
        <Button variant="filled" className="flex-1 !rounded-xl" onClick={() => setShowLeadForm(true)}>
           Liên hệ
        </Button>
      </div>

      {/* --- AI Concierge --- */}
      <AIConcierge property={property} networkStatus={networkStatus} />

      {/* --- Lead Form Modal --- */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            <LeadForm 
              networkStatus={networkStatus} 
              onClose={() => setShowLeadForm(false)} 
            />
          </div>
        </div>
      )}

      {/* --- Debugger for Mobile (Simulate Network) --- */}
      <div className="md:hidden fixed top-24 right-4 flex flex-col gap-2 z-0 opacity-30 hover:opacity-100 transition-opacity">
         <button onClick={() => toggleNetwork(ConnectionStatus.OFFLINE)} className="bg-red-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center">
           <Icon name="wifi_off" />
         </button>
         <button onClick={() => toggleNetwork(ConnectionStatus.DEGRADED)} className="bg-orange-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center">
           <Icon name="network_check" />
         </button>
         <button onClick={() => toggleNetwork(ConnectionStatus.ONLINE)} className="bg-green-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center">
           <Icon name="wifi" />
         </button>
      </div>

    </div>
  );
};

export default App;