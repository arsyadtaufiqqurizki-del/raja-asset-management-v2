import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAsset, Asset } from '../context/AssetContext';

interface EditAssetModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAssetModal({ asset, isOpen, onClose }: EditAssetModalProps) {
  const { updateAsset } = useAsset();
  
  const [formData, setFormData] = useState({
    assetNumber: '',
    assetDescription: '',
    assetBook: '',
    assetUnits: '1',
    assetCost: '',
    datePlacedInService: '',
    categorySegment1: '',
    categorySegment2: '',
    depreciationMethod: '',
    lifeInMonths: '',
    listedStatus: 'Non-Listed',
    status: 'Active',
    // Fallback/legacy fields for context backwards compatibility
    name: '',
    val: '',
    date: '',
    category: 'Vehicles',
    subsidiary: 'PT Rukun Raharja Tbk (Induk Perusahaan)',
    condition: 'Excellent',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (asset && isOpen) {
      let defaultDate = new Date().toISOString().split('T')[0];
      try {
        const d = new Date(asset.datePlacedInService || asset.date);
        if (!isNaN(d.getTime())) {
          defaultDate = d.toISOString().split('T')[0];
        }
      } catch (e) {}

      setFormData({
        assetNumber: asset.assetNumber || asset.id,
        assetDescription: asset.assetDescription || asset.name,
        assetBook: asset.assetBook || '',
        assetUnits: asset.assetUnits ? asset.assetUnits.toString() : '1',
        assetCost: asset.assetCost || asset.val.replace(/\D/g, ''),
        datePlacedInService: defaultDate,
        categorySegment1: asset.categorySegment1 || '',
        categorySegment2: asset.categorySegment2 || '',
        depreciationMethod: asset.depreciationMethod || '',
        lifeInMonths: asset.lifeInMonths ? asset.lifeInMonths.toString() : '',
        listedStatus: asset.listedStatus || 'Non-Listed',
        status: asset.status || 'Active',
        name: asset.name,
        val: asset.val,
        date: defaultDate,
        category: asset.category || 'Vehicles',
        subsidiary: asset.subsidiary || 'PT Rukun Raharja Tbk (Induk Perusahaan)',
        condition: asset.condition || 'Excellent',
      });
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);
    
    // Auto sync old standard fields with the new mapped input values
    const finalAsset = {
      ...formData,
      id: formData.assetNumber,
      name: formData.assetDescription,
      val: formData.assetCost.startsWith('$') ? formData.assetCost : `$${formData.assetCost}`,
      date: formData.datePlacedInService,
    };

    let conditionLevel: 'good' | 'warning' | 'error' = 'good';
    let statusLevel: 'success' | 'warning' | 'error' | 'neutral' = 'success';
    if (finalAsset.status === 'Needs Service') statusLevel = 'warning';
    if (finalAsset.status === 'In Maintenance') statusLevel = 'error';
    if (finalAsset.status === 'Retired') statusLevel = 'neutral';

    try {
      await updateAsset(asset.id, {
        ...finalAsset,
        assetUnits: finalAsset.assetUnits ? Number(finalAsset.assetUnits) : undefined,
        lifeInMonths: finalAsset.lifeInMonths ? Number(finalAsset.lifeInMonths) : undefined,
        conditionLevel,
        statusLevel
      });
      
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update asset. Please check the values.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-surface-container-lowest shadow-xl border border-outline-variant">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <h3 className="text-xl font-bold text-on-surface">Edit Asset: {asset.id}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary rounded-full p-1 hover:bg-surface-container-low transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-1">
          <form id="edit-asset-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
            {errorMsg && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error font-medium">
                {errorMsg}
              </div>
            )}
            
            {/* Bagian 1: Identitas Aset */}
            <section>
              <h4 className="font-semibold text-primary mb-4 border-b border-outline-variant pb-2">Bagian 1: Identitas Aset</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Asset Number <span className="text-error">*</span></label>
                  <input required placeholder="e.g. RRPL/23/1.30.01/004" value={formData.assetNumber} onChange={handleInputChange('assetNumber')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Asset Description <span className="text-error">*</span></label>
                  <input required placeholder="e.g. Toyota Fortuner 2023" value={formData.assetDescription} onChange={handleInputChange('assetDescription')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Asset Book</label>
                  <input placeholder="e.g. RRPL" value={formData.assetBook} onChange={handleInputChange('assetBook')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Asset Units</label>
                  <input type="number" required placeholder="e.g. 1" value={formData.assetUnits} onChange={handleInputChange('assetUnits')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>
            </section>

            {/* Bagian 2: Nilai & Akuisisi */}
            <section>
              <h4 className="font-semibold text-primary mb-4 border-b border-outline-variant pb-2">Bagian 2: Nilai & Akuisisi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Asset Cost (Valuation) <span className="text-error">*</span></label>
                  <input required placeholder="e.g. 450000000" value={formData.assetCost} onChange={handleInputChange('assetCost')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Date Placed in Service <span className="text-error">*</span></label>
                  <input type="date" required value={formData.datePlacedInService} onChange={handleInputChange('datePlacedInService')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>
            </section>

            {/* Bagian 3: Kategorisasi */}
            <section>
              <h4 className="font-semibold text-primary mb-4 border-b border-outline-variant pb-2">Bagian 3: Kategorisasi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Category Segment 1</label>
                  <input placeholder="e.g. Kendaraan" value={formData.categorySegment1} onChange={handleInputChange('categorySegment1')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Category Segment 2 (Location)</label>
                  <input placeholder="e.g. Thamres, Jakarta" value={formData.categorySegment2} onChange={handleInputChange('categorySegment2')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>
            </section>

            {/* Bagian 4: Akuntansi / Penyusutan */}
            <section>
              <h4 className="font-semibold text-primary mb-4 border-b border-outline-variant pb-2">Bagian 4: Akuntansi / Penyusutan</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Depreciation Method</label>
                  <input placeholder="e.g. Straight Line" value={formData.depreciationMethod} onChange={handleInputChange('depreciationMethod')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Life in Months</label>
                  <input type="number" placeholder="e.g. 48" value={formData.lifeInMonths} onChange={handleInputChange('lifeInMonths')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>
            </section>

            {/* Bagian 5: Status */}
            <section>
              <h4 className="font-semibold text-primary mb-4 border-b border-outline-variant pb-2">Bagian 5: Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Listed Status</label>
                  <select value={formData.listedStatus} onChange={handleInputChange('listedStatus')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                    <option value="Listed">Listed</option>
                    <option value="Non-Listed">Non-Listed</option>
                    <option value="Audited">Audited</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-on-surface">Current Status</label>
                  <select value={formData.status} onChange={handleInputChange('status')} className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                    <option value="Active">Active</option>
                    <option value="Needs Service">Needs Service</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
            </section>

          </form>
        </div>

        <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-asset-form"
            disabled={isSaving}
            className="px-6 py-2 text-sm font-medium bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
