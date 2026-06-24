import { Eye, Edit2, Calendar, Filter, ChevronLeft, ChevronRight, Search, Trash2, Upload, Download } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAsset, Asset } from '../context/AssetContext';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EditAssetModal from '../components/EditAssetModal';
import ImportExcelModal from '../components/ImportExcelModal';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 7;

export default function Inventory() {
  const { assets, deleteAsset } = useAsset();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [subFilter, setSubFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<{id: string, name: string} | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const nameStr = asset.name || asset.assetDescription || '';
      const idStr = asset.id || asset.assetNumber || '';
      const matchesSearch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            idStr.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSub = subFilter ? asset.subsidiary === subFilter : true;
      const matchesCat = catFilter ? (asset.categorySegment1 || asset.category) === catFilter : true;
      const matchesStatus = statusFilter ? asset.status === statusFilter : true;
      
      return matchesSearch && matchesSub && matchesCat && matchesStatus;
    });
  }, [assets, searchTerm, subFilter, catFilter, statusFilter]);
  
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchTerm('');
    setSubFilter('');
    setCatFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };
  
  const handleDelete = (id: string, name: string) => {
    setAssetToDelete({ id, name });
  };

  // Get unique values for filters
  const subsidiaries = Array.from(new Set(assets.map(a => a.subsidiary)));
  const categories = Array.from(new Set(assets.map(a => a.categorySegment1 || a.category)));
  const statuses = Array.from(new Set(assets.map(a => a.status)));

  const handleExport = () => {
    const dataToExport = filteredAssets.map(asset => ({
      'Asset ID': asset.id,
      'Name': asset.name,
      'Subsidiary': asset.subsidiary,
      'Category': asset.categorySegment1 || asset.category,
      'Purchase Date': asset.date,
      'Value (USD)': parseInt(String(asset.val || '').replace(/[^0-9]/g, '')) || 0,
      'Condition': asset.condition,
      'Status': asset.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

    XLSX.writeFile(workbook, `Asset_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-[180px])] min-h-[600px]">
      <EditAssetModal asset={editingAsset} isOpen={!!editingAsset} onClose={() => setEditingAsset(null)} />
      <ImportExcelModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      
      {assetToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl max-w-sm w-full p-6 shadow-xl border border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface mb-2">Delete Asset</h3>
            <p className="text-on-surface-variant mb-6 text-sm">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{assetToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 flex-wrap">
              <button 
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 rounded-lg font-medium text-sm text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteAsset(assetToDelete.id);
                  setAssetToDelete(null);
                }}
                className="px-4 py-2 rounded-lg font-medium text-sm text-white bg-error hover:bg-error/90 transition-colors"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Asset Inventory</h2>
          <p className="text-sm text-on-surface-variant mt-1">Manage and track enterprise assets across all subsidiaries.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors text-on-surface whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors text-on-surface whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-wrap gap-4 items-center shadow-sm">
        <span className="text-xs font-semibold text-on-surface-variant uppercase flex items-center gap-1.5 tracking-wider">
          <Filter className="h-4 w-4" /> Filters
        </span>
        <div className="flex-1 flex flex-wrap gap-2.5">
          <select 
            value={subFilter} 
            onChange={(e) => setSubFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-md text-sm py-1.5 px-3 min-w-[160px] focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">All Subsidiaries</option>
            {subsidiaries.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
          <select 
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-md text-sm py-1.5 px-3 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-md text-sm py-1.5 px-3 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <button 
          onClick={clearFilters}
          className="text-sm font-medium text-secondary hover:text-primary transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap tracking-wider">Asset Book</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap tracking-wider">Asset Number</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap tracking-wider">Asset Description</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap text-right tracking-wider">Asset Cost (Valuation)</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap tracking-wider">Date Placed in Services</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap text-center tracking-wider">Asset Units</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap tracking-wider">Asset Category Segment 2</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap tracking-wider">Depreciation Method</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap text-center tracking-wider">Life in Months</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap text-center tracking-wider">Listed</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap text-center tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-on-surface-variant uppercase whitespace-nowrap text-right tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/30">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-on-surface-variant">
                    No assets found matching your current filters.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="py-4 px-4 font-semibold text-on-surface">{asset.assetBook || '-'}</td>
                    <td className="py-4 px-4 font-mono text-secondary text-xs">{asset.assetNumber || asset.id}</td>
                    <td className="py-4 px-4 font-semibold text-on-surface">{asset.assetDescription || asset.name}</td>
                    <td className="py-4 px-4 font-mono text-xs text-right text-on-surface">{formatCurrency(asset.assetCost || asset.val)}</td>
                    <td className="py-4 px-4 text-on-surface-variant font-mono text-xs">{asset.datePlacedInService || asset.date}</td>
                    <td className="py-4 px-4 text-center">{asset.assetUnits || '-'}</td>
                    <td className="py-4 px-4 text-on-surface">{asset.categorySegment2 || '-'}</td>
                    <td className="py-4 px-4 text-on-surface">{asset.depreciationMethod || '-'}</td>
                    <td className="py-4 px-4 text-center">{asset.lifeInMonths || '-'}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                        asset.listedStatus === 'Listed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        asset.listedStatus === 'Non-Listed' ? 'bg-surface-container text-on-surface-variant border-outline-variant' :
                        asset.listedStatus === 'Audited' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-surface-container text-on-surface-variant border-outline-variant'
                      )}>
                        {asset.listedStatus || asset.listed || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border",
                        asset.statusLevel === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                        asset.statusLevel === 'warning' ? "bg-amber-50 border-amber-200 text-amber-800" : 
                        asset.statusLevel === 'error' ? "bg-error-container/40 border-error/20 text-on-error-container" :
                        "bg-surface-variant text-on-surface-variant border-outline-variant/50"
                      )}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingAsset(asset)} className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Edit"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(asset.id, asset.name)} className="text-on-surface-variant hover:text-error transition-colors p-1" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-outline-variant bg-surface-container flex items-center justify-between text-sm mt-auto">
          <span className="text-on-surface-variant">
            Showing {filteredAssets.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} entries of {filteredAssets.length}
          </span>
          <div className="flex items-center gap-1 text-sm font-medium">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-highest disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5"/>
            </button>
            <button className="w-8 h-8 rounded bg-primary text-on-primary font-bold flex items-center justify-center shadow-sm">
              {currentPage}
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-highest disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
