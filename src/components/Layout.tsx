import { Bell, Search, UserCircle, Menu, AlertTriangle, AlertCircle, Info, Bot } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Archive, Wrench, BarChart2, Settings, Plus, HelpCircle, LogOut } from "lucide-react";
import { cn } from "../lib/utils";
import AddAssetModal from "./AddAssetModal";
import { useAsset } from "../context/AssetContext";
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import AiSidebar from "./AiSidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Asset Inventory", href: "/inventory", icon: Archive },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Reports", href: "/reports", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { assets, setIsAddModalOpen } = useAsset();

  const [userName, setUserName] = useState("Admin User");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  useEffect(() => {
    const savedProfile = localStorage.getItem('pr_profile_data');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setUserName(parsed.name);
      } catch (e) {}
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = assets.filter(
    (asset) => asset.conditionLevel === 'error' || asset.conditionLevel === 'warning' || asset.statusLevel === 'error' || asset.statusLevel === 'warning'
  );

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        navigate(`/inventory?q=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate(`/inventory`);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background">
      <AddAssetModal />
      <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface-container-lowest border-r border-outline-variant transition-transform duration-300 md:static md:translate-x-0 hidden md:flex",
        mobileMenuOpen ? "flex translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col gap-2 border-b border-outline-variant/30 p-6">
          <h1 className="text-xl font-bold text-primary tracking-tight">Perusahaan Raja</h1>
          <p className="text-xs font-medium text-on-surface-variant">Asset Management</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto w-full p-2 py-4">
          <ul className="flex flex-col gap-1 w-full">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href} className="w-full">
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors w-full",
                      isActive
                        ? "bg-secondary-container text-on-secondary-container border-r-4 border-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <div className="h-px bg-outline-variant/50 w-full my-2"></div>
            <li className="w-full">
              <button
                onClick={() => { setIsAiOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors w-full text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              >
                <Bot className="h-5 w-5" />
                MiMo AI Assistant
              </button>
            </li>
          </ul>
        </nav>

        <div className="mt-auto border-t border-outline-variant/30 p-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add New Asset
          </button>
          
          <ul className="mt-4 flex flex-col gap-1 w-full">
            <li>
              <a href="mailto:arsyad.taufiqqurizki@gmail.com" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">
                <HelpCircle className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="font-semibold text-xs">Support: Arsyad Taufiqqurizqi</span>
                  <span className="text-[10px] opacity-80 break-all">arsyad.taufiqqurizki@gmail.com</span>
                </div>
              </a>
            </li>
            <li>
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex min-h-16 h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/80 px-4 backdrop-blur-md md:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-on-surface-variant hover:text-primary md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="hidden md:flex relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search assets, records..."
                className="w-64 rounded-full border border-outline-variant bg-surface-container-lowest py-1.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <h1 className="text-xl font-bold text-primary md:hidden">PR</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-error border-2 border-surface" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-outline-variant bg-surface-container-lowest p-0 shadow-lg z-50 overflow-hidden flex flex-col">
                  {/* ... notifications ... */}
                  <div className="flex items-center justify-between border-b border-outline-variant/50 p-4 pb-3">
                    <h3 className="font-semibold text-on-surface">Notifications</h3>
                    <span className="bg-surface-container-highest text-on-surface text-xs px-2 py-0.5 rounded-full font-medium">{notifications.length} New</span>
                  </div>
                  <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-on-surface-variant flex flex-col items-center gap-2">
                        <Info className="h-8 w-8 text-outline" />
                        <p className="text-sm">You're all caught up!</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-outline-variant/30">
                        {notifications.map((asset) => {
                          const isError = asset.conditionLevel === 'error' || asset.statusLevel === 'error';
                          return (
                            <li key={asset.id} className="p-4 hover:bg-surface-container-low transition-colors flex gap-3 cursor-pointer" onClick={() => { setShowNotifications(false); navigate(`/inventory?q=${asset.id}`); }}>
                               <div className={cn(
                                 "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
                                 isError ? "bg-error-container/40 text-error" : "bg-amber-100 text-amber-600"
                               )}>
                                 {isError ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                               </div>
                               <div className="flex flex-col gap-1">
                                 <p className="text-sm text-on-surface font-medium leading-tight">
                                   [{asset.id}] {asset.name}
                                 </p>
                                 <p className="text-xs text-on-surface-variant leading-tight">
                                   {isError 
                                     ? `Critical attention needed. Status: ${asset.status}, Condition: ${asset.condition}.` 
                                     : `Requires review. Status: ${asset.status}, Condition: ${asset.condition}.`}
                                 </p>
                                 <span className="text-[10px] text-on-surface-variant/70 font-mono mt-1">{asset.subsidiary}</span>
                               </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-outline-variant/50 bg-surface-container-lowest text-center">
                       <Link to="/inventory" onClick={() => setShowNotifications(false)} className="text-xs font-semibold text-primary hover:underline">View All Assets</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors focus:outline-none"
              >
                <UserCircle className="h-6 w-6" />
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-outline-variant/50 mb-1">
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Account</p>
                    <p className="text-sm font-medium text-on-surface truncate">{userName}</p>
                  </div>
                  <Link 
                    to="/settings" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-lg transition-colors"
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="h-px bg-outline-variant/50 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error-container/20 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
