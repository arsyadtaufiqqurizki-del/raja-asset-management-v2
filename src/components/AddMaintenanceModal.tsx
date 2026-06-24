import { X } from 'lucide-react';
import { useState } from 'react';
import { useAsset } from '../context/AssetContext';
import { auth } from '../lib/firebase';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMaintenanceModal({ isOpen, onClose }: AddMaintenanceModalProps) {
  const { assets } = useAsset();
  const [assetId, setAssetId] = useState('');
  const [type, setType] = useState('Routine Service');
  const [date, setDate] = useState('');
  const [cost, setCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [status, setStatus] = useState('Pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !date) return;
    
    setIsSubmitting(true);
    
    // Find the corresponding asset to grab subsidiary
    const selectedAsset = assets.find(a => a.id === assetId);
    if (!selectedAsset) {
      alert("Please select a valid asset.");
      setIsSubmitting(false);
      return;
    }

    try {
      const id = `MNT-${Math.floor(1000 + Math.random() * 9000)}`;
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No token");

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          maintenanceId: id,
          assetId,
          sub: selectedAsset.subsidiary,
          type,
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          cost: cost ? `$${parseInt(cost.replace(/\D/g, ''), 10).toLocaleString('en-US')}` : '--',
          estimatedCost: cost ? `$${parseInt(cost.replace(/\D/g, ''), 10).toLocaleString('en-US')}` : '--',
          actualCost: status === 'Completed' && actualCost ? `$${parseInt(actualCost.replace(/\D/g, ''), 10).toLocaleString('en-US')}` : '--',
          status,
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      onClose();
      // Reset form
      setAssetId(''); setType('Routine Service'); setDate(''); setCost(''); setActualCost(''); setStatus('Pending');
    } catch (error) {
      console.error("Error adding maintenance record:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant bg-surface-bright">
          <h2 className="text-xl font-bold text-on-surface">Add Maintenance Record</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <X className="h-5 w-5 text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Asset</label>
            <select 
              required
              className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">Select an asset...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>[{a.id}] {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Service Type</label>
            <select 
              className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="Routine Service">Routine Service</option>
              <option value="Emergency Repair">Emergency Repair</option>
              <option value="Inspection">Inspection</option>
              <option value="Calibration">Calibration</option>
              <option value="HVAC Service">HVAC Service</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Date</label>
              <input 
                required
                type="date"
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Status</label>
              <select 
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Estimated Cost (USD)</label>
              <input 
                type="number"
                placeholder="e.g. 500000"
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
            {status === 'Completed' && (
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Actual Cost (USD)</label>
                <input 
                  type="number"
                  placeholder="e.g. 450000"
                  className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-outline-variant mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant hover:bg-surface-container font-medium rounded-lg transition-colors border border-transparent hover:border-outline-variant/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-on-primary font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
