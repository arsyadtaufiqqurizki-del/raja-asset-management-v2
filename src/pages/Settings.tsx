import { User, SlidersHorizontal, BellRing, Shield, Camera, Lock, Moon, Globe, Type, Bell, Mail, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@perusahaanraja.com'
  });

  // Config Form State
  const [configData, setConfigData] = useState({
    theme: 'system',
    language: 'id',
    fontSize: 'medium'
  });

  // Notification State
  const [notifData, setNotifData] = useState({
    emailAlerts: true,
    pushNotifs: false,
    weeklyReport: true
  });

  // Load from Local Storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('pr_profile_data');
    if (savedProfile) setProfileData(JSON.parse(savedProfile));

    const savedConfig = localStorage.getItem('pr_config_data');
    if (savedConfig) setConfigData(JSON.parse(savedConfig));

    const savedNotif = localStorage.getItem('pr_notif_data');
    if (savedNotif) setNotifData(JSON.parse(savedNotif));
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem('pr_profile_data', JSON.stringify(profileData));
    alert("Profile changes saved successfully.");
  };

  const handleSaveConfig = () => {
    localStorage.setItem('pr_config_data', JSON.stringify(configData));
    alert("System configuration saved successfully.");
  };

  const handleSaveNotif = () => {
    localStorage.setItem('pr_notif_data', JSON.stringify(notifData));
    alert("Notification preferences saved successfully.");
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface mb-2">Account Settings</h1>
        <p className="text-base text-on-surface-variant max-w-2xl">Manage your profile, system preferences, notification alerts, and security protocols.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Settings Navigation Sidebar */}
        <nav className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide bg-surface-container-lowest rounded-xl border border-outline-variant p-2 shadow-sm">
           <button 
             onClick={() => setActiveTab('profile')}
             className={cn("text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors whitespace-nowrap",
               activeTab === 'profile' ? "bg-surface-container-low text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
             )}>
              <User className={cn("h-5 w-5", activeTab === 'profile' && "fill-current")} /> User Profile
           </button>
           <button 
             onClick={() => setActiveTab('config')}
             className={cn("text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors whitespace-nowrap",
               activeTab === 'config' ? "bg-surface-container-low text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
             )}>
              <SlidersHorizontal className={cn("h-5 w-5", activeTab === 'config' && "text-primary")} /> System Configuration
           </button>
           <button 
             onClick={() => setActiveTab('notif')}
             className={cn("text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors whitespace-nowrap",
               activeTab === 'notif' ? "bg-surface-container-low text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
             )}>
              <BellRing className={cn("h-5 w-5", activeTab === 'notif' && "text-primary")} /> Notifications
           </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {activeTab === 'profile' && (
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-outline-variant">
                <h3 className="text-xl font-bold text-on-surface">User Profile</h3>
                <p className="text-sm text-on-surface-variant mt-1">Update your personal information and profile photo.</p>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-10">
                  
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="relative group cursor-pointer">
                      <div className="w-32 h-32 rounded-lg overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center relative">
                        <img 
                          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80" 
                          alt="Admin Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="absolute inset-0 bg-primary/70 text-on-primary flex flex-col items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 mb-2" />
                        <span className="text-sm font-semibold">Change</span>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-on-surface-variant text-center max-w-[150px]">
                      JPG, GIF or PNG. Max size of 800K
                    </p>
                  </div>

                  {/* Form */}
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-on-surface">Full Name</label>
                        <input 
                          type="text" 
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" 
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-on-surface">Email Address</label>
                        <input 
                          type="email" 
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-on-surface">System Role</label>
                      <div className="px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface-variant flex items-center justify-between cursor-not-allowed">
                        <span>System Administrator</span>
                        <Lock className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-mono text-on-surface-variant mt-1.5">Role assignments can only be modified by Super Admins.</p>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button 
                        onClick={handleSaveProfile}
                        className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          )}

          {activeTab === 'config' && (
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-outline-variant">
                <h3 className="text-xl font-bold text-on-surface">System Configuration</h3>
                <p className="text-sm text-on-surface-variant mt-1">Manage global preferences and UI accessibility.</p>
              </div>
              <div className="p-6 md:p-8 flex flex-col gap-6">
                
                {/* Theme */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-outline-variant rounded-xl bg-surface">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-container rounded-lg text-primary"><Moon className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">Color Theme</p>
                      <p className="text-xs text-on-surface-variant">Select your preferred interface color mode.</p>
                    </div>
                  </div>
                  <select 
                    value={configData.theme}
                    onChange={(e) => setConfigData({ ...configData, theme: e.target.value })}
                    className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary outline-none"
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">System Default</option>
                  </select>
                </div>

                {/* Language */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-outline-variant rounded-xl bg-surface">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-container rounded-lg text-primary"><Globe className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">Language / Locale</p>
                      <p className="text-xs text-on-surface-variant">Current display language for the dashboard.</p>
                    </div>
                  </div>
                  <select 
                    value={configData.language}
                    onChange={(e) => setConfigData({ ...configData, language: e.target.value })}
                    className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary outline-none"
                  >
                    <option value="en">English (US)</option>
                    <option value="id">Bahasa Indonesia</option>
                  </select>
                </div>

                {/* Typography / Accessibility */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-outline-variant rounded-xl bg-surface">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-container rounded-lg text-primary"><Type className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">Typography Scale</p>
                      <p className="text-xs text-on-surface-variant">Adjust the base font size for better readability.</p>
                    </div>
                  </div>
                  <select 
                    value={configData.fontSize}
                    onChange={(e) => setConfigData({ ...configData, fontSize: e.target.value })}
                    className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary outline-none"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium (Default)</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                   <button 
                     onClick={handleSaveConfig}
                     className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                   >
                     Save Preferences
                   </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'notif' && (
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-outline-variant">
                <h3 className="text-xl font-bold text-on-surface">Notification Alerts</h3>
                <p className="text-sm text-on-surface-variant mt-1">Control how and when you receive system alerts.</p>
              </div>
              <div className="p-6 md:p-8 flex flex-col gap-6">
                
                <div className="flex items-center justify-between p-4 border-b border-outline-variant/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-surface-container rounded-lg text-primary mt-1"><Mail className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">Email Alerts</p>
                      <p className="text-xs text-on-surface-variant max-w-sm mt-0.5">Receive notifications via email when assets change conditions heavily or trigger maintenance routines.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifData.emailAlerts}
                      onChange={(e) => setNotifData({ ...notifData, emailAlerts: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-outline-variant/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-surface-container rounded-lg text-primary mt-1"><Smartphone className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">Push Notifications</p>
                      <p className="text-xs text-on-surface-variant max-w-sm mt-0.5">Allow browser push notifications for emergency alerts in real-time.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifData.pushNotifs}
                      onChange={(e) => setNotifData({ ...notifData, pushNotifs: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-surface-container rounded-lg text-primary mt-1"><Bell className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">Weekly Activity Report</p>
                      <p className="text-xs text-on-surface-variant max-w-sm mt-0.5">Receive a compiled summary email every Monday regarding asset performances.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifData.weeklyReport}
                      onChange={(e) => setNotifData({ ...notifData, weeklyReport: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                   <button 
                     onClick={handleSaveNotif}
                     className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                   >
                     Save Notifications
                   </button>
                </div>

              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
