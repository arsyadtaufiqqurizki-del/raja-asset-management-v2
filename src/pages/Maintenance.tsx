import { Settings as SettingsIcon, AlertTriangle, CircleDollarSign, CalendarDays, ArrowRight, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import CalendarModal from '../components/CalendarModal';
import AddMaintenanceModal from '../components/AddMaintenanceModal';
import EditMaintenanceModal from '../components/EditMaintenanceModal';
import { auth } from '../lib/firebase';

const initialRecentActivity: any[] = [];

export default function Maintenance() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);

  const fetchMaintenance = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/maintenance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const records = await response.json();
        setRecentActivity(records);
      }
    } catch (error) {
      console.error("Error fetching maintenance: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchMaintenance();
      } else {
        setRecentActivity([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const totalCost = recentActivity.reduce((acc, curr) => {
    const costStr = curr.actualCost && curr.actualCost !== '--' ? curr.actualCost : (curr.estimatedCost || curr.cost);
    if (!costStr || costStr === '--') return acc;
    const numericCost = parseInt(costStr.replace(/\D/g, '')) || 0;
    return acc + numericCost;
  }, 0);

  let formattedTotalCost = `$${totalCost.toLocaleString('en-US')}`;
  if (totalCost >= 1_000_000_000) {
    formattedTotalCost = `$${(totalCost / 1_000_000_000).toFixed(1)}B`;
  } else if (totalCost >= 1_000_000) {
    formattedTotalCost = `$${(totalCost / 1_000_000).toFixed(1)}M`;
  }

  const assetsUnderMaintCount = recentActivity.filter(a => a.status === 'In Progress').length;
  const overdueCount = recentActivity.filter(a => a.status === 'Overdue').length;
  const upcomingCount = recentActivity.filter(a => a.status === 'Pending').length;
  
  const upcomingSchedule = recentActivity.filter(a => a.status === 'Pending').slice(0, 3);

  const handleDelete = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMaintenance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} maintenanceData={recentActivity} />
      <AddMaintenanceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditMaintenanceModal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} record={editingRecord} onSuccess={fetchMaintenance} />
      
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-sm shadow-xl p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-on-surface">Delete Maintenance Record</h3>
            <p className="text-on-surface-variant text-sm">
              Are you sure you want to delete the maintenance record for <span className="font-semibold text-on-surface">{recordToDelete.assetId || recordToDelete.id}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button 
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-lg font-medium text-sm text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDelete(recordToDelete.maintenanceId || recordToDelete.id);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 rounded-lg font-medium text-sm text-white bg-error hover:bg-error/90 transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Maintenance Overview</h2>
          <p className="text-sm text-on-surface-variant mt-1">Monitor asset health and service schedules across all facilities.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-on-primary px-4 py-2 font-medium rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <SettingsIcon className="h-4 w-4" /> Add Maintenance Record
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-sm font-medium mb-3">
            <span>Assets Under Maint.</span>
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div className="text-4xl font-bold text-on-surface mb-2">{assetsUnderMaintCount}</div>
          <div className="text-sm text-on-surface-variant">
            Current active services
          </div>
        </div>

        <div className="rounded-xl border border-error/30 bg-error-container/20 p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between text-on-error-container text-sm font-bold mb-3">
            <span>Overdue Maintenance</span>
            <AlertTriangle className="h-5 w-5 fill-current text-error" />
          </div>
          <div className="text-4xl font-bold text-error mb-2">{overdueCount}</div>
          <div className="text-sm text-on-error-container">
            Requires immediate attention
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-sm font-medium mb-3">
            <span>Total Cost (YTD)</span>
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div className="text-4xl font-bold text-on-surface mb-2">{formattedTotalCost}</div>
          <div className="text-sm text-on-surface-variant">
            Total accumulated cost
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant text-sm font-medium mb-3">
            <span>Upcoming / Pending</span>
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="text-4xl font-bold text-on-surface mb-2">{upcomingCount}</div>
          <div className="text-sm text-on-surface-variant">
            Scheduled activities
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
            <h3 className="text-lg font-semibold text-on-surface">Recent Maintenance Activity</h3>
            <button className="text-sm font-medium text-primary hover:text-on-surface transition-colors flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant">Asset ID</th>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant">Subsidiary</th>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant">Type</th>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant">Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant">Est. Cost</th>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant">Act. Cost</th>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant/30">
                {recentActivity.map((act) => (
                  <tr key={act.id} className={cn("hover:bg-surface-container-lowest transition-colors", act.status === 'Overdue' ? "bg-error-container/5" : "")}>
                    <td className={cn("py-3 px-4 font-mono text-xs font-medium", act.status === 'Overdue' ? "text-error" : "text-primary")}>{act.assetId || act.id}</td>
                    <td className="py-3 px-4">{act.sub}</td>
                    <td className="py-3 px-4">{act.type}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{act.date}</td>
                    <td className="py-3 px-4 font-mono text-xs">{act.estimatedCost || act.cost}</td>
                    <td className="py-3 px-4 font-mono text-xs">{act.actualCost || '--'}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => setEditingRecord(act)}
                        className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border hover:opacity-80 transition-opacity cursor-pointer",
                        act.status === 'Completed' ? "bg-primary-fixed text-on-primary-fixed border-transparent" :
                        act.status === 'In Progress' ? "bg-secondary-container text-on-secondary-container border-transparent" :
                        act.status === 'Pending' ? "bg-surface-variant text-on-surface-variant border-transparent" :
                        "bg-error-container text-on-error-container border-error/20"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                           act.status === 'Completed' ? "bg-primary" :
                           act.status === 'In Progress' ? "bg-secondary" :
                           act.status === 'Pending' ? "bg-outline" : "bg-error"
                        )} />
                        {act.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => setRecordToDelete(act)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-md hover:bg-surface-container"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
            <h3 className="text-lg font-semibold text-on-surface">Maintenance Schedule</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-4">
            
            {upcomingSchedule.length === 0 ? (
              <div className="text-center text-on-surface-variant p-4">No upcoming schedules.</div>
            ) : (
              upcomingSchedule.map((sched, idx) => (
                <div key={sched.id || idx} className="flex gap-4">
                  <div className="flex flex-col items-center mt-1">
                    <div className={cn("w-2.5 h-2.5 rounded-full", idx === 0 ? "bg-primary" : "bg-outline")} />
                    {idx < upcomingSchedule.length - 1 && <div className="w-px h-10 bg-outline-variant/60 my-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className={cn("text-xs font-bold mb-1.5 uppercase tracking-wide", idx === 0 ? "text-primary" : "text-on-surface-variant")}>
                      {sched.date}
                    </div>
                    <div className="bg-surface border border-outline-variant rounded-lg p-3">
                      <div className="font-mono text-xs font-semibold text-on-surface mb-1">{sched.assetId || sched.id}: {sched.type}</div>
                      <div className="text-xs text-on-surface-variant">{sched.sub}</div>
                    </div>
                  </div>
                </div>
              ))
            )}

          </div>
          <div className="p-3 border-t border-outline-variant text-center mt-auto">
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="text-sm font-semibold text-primary hover:underline py-1 w-full"
            >
              View Full Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
