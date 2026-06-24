import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { useAsset } from '../context/AssetContext';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceData: any[];
}

export default function CalendarModal({ isOpen, onClose, maintenanceData }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isOpen) return null;

  // Simple calendar generation
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Derive events from maintenanceData
  const events: Record<number, { title: string, type: 'routine' | 'emergency' | 'inspection' }[]> = {};
  
  maintenanceData.forEach((activity) => {
    if (!activity.date) return;
    const activityDate = new Date(activity.date);
    if (
      activityDate.getFullYear() === currentDate.getFullYear() &&
      activityDate.getMonth() === currentDate.getMonth()
    ) {
      const day = activityDate.getDate();
      if (!events[day]) events[day] = [];
      
      let type: 'routine' | 'emergency' | 'inspection' = 'routine';
      const typeStr = (activity.type || '').toLowerCase();
      if (typeStr.includes('emergency')) {
        type = 'emergency';
      } else if (typeStr.includes('inspection')) {
        type = 'inspection';
      } else {
        type = 'routine';
      }
      
      events[day].push({
        title: activity.assetId,
        type: type
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-outline-variant bg-surface-bright">
          <h2 className="text-xl font-bold text-on-surface">Full Maintenance Calendar</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <X className="h-5 w-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-on-surface flex items-center gap-2">
              {monthNames[currentDate.getMonth()]} <span className="text-on-surface-variant">{currentDate.getFullYear()}</span>
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-outline-variant/50 rounded-xl overflow-hidden border border-outline-variant/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-surface text-center py-3 text-sm font-semibold text-on-surface-variant">
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-surface-container-lowest/50 min-h-[120px] p-2" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = events[day] || [];
              const isToday = day === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() && 
                              currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div key={day} className={cn(
                  "bg-surface-container-lowest min-h-[120px] p-2 flex flex-col gap-1 transition-colors hover:bg-surface-container-low/50 group border-t border-outline-variant/30 relative",
                  isToday ? "bg-primary/5" : ""
                )}>
                  <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                    isToday ? "bg-primary text-on-primary" : "text-on-surface-variant group-hover:text-on-surface"
                  )}>
                    {day}
                  </span>
                  
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
                    {dayEvents.map((evt, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "text-xs px-2 py-1 rounded truncate border font-medium",
                          evt.type === 'emergency' ? "bg-error-container text-on-error-container border-error/20" : 
                          evt.type === 'inspection' ? "bg-secondary-container text-on-secondary-container border-secondary/20" :
                          "bg-primary-fixed text-on-primary-fixed border-transparent"
                        )}
                        title={`${evt.title} - ${evt.type}`}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-on-surface-variant justify-center sm:justify-start">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary-fixed"></span> Routine Service</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-secondary-container"></span> Inspection</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-error-container"></span> Emergency</div>
          </div>
        </div>
      </div>
    </div>
  );
}
