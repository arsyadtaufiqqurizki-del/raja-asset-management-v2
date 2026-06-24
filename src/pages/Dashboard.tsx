import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { Package, TrendingUp, TrendingDown, AlertTriangle, FileUp, Download, Plus } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useAsset } from '../context/AssetContext';
import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

const categoryColors: Record<string, string> = {
  'Vehicles': '#0F172A',
  'Buildings': '#131b2e',
  'Electronics': '#515f74',
  'Heavy Mach.': '#334155'
};



export default function Dashboard() {
  const { assets, setIsAddModalOpen } = useAsset();
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const recentAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => {
        const d1 = new Date(a.date).getTime();
        const d2 = new Date(b.date).getTime();
        if (isNaN(d1)) return 1;
        if (isNaN(d2)) return -1;
        return d2 - d1;
      })
      .slice(0, 10);
  }, [assets]);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const availableYears = Array.from(new Set(
    assets.map(a => {
      const d = new Date(a.date);
      return isNaN(d.getTime()) ? currentYear : d.getFullYear();
    })
  )).sort((a, b) => b - a);

  if (!availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear);
    availableYears.sort((a, b) => b - a);
  }

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const totalAssets = assets.length;
  const totalValuation = assets.reduce((sum, asset) => {
    const cost = asset.assetCost ? asset.assetCost.replace(/\D/g, '') : (asset.val || '').replace(/\D/g, '');
    return sum + (parseInt(cost) || 0);
  }, 0);
  
  const damagedAssets = assets.filter(a => a.conditionLevel === 'error').length;
  
  // Format totalValuation properly (Trillions, Billions, Millions)
  let formattedValuation = `$${totalValuation.toLocaleString('en-US')}`;
  let valuationSuffix = '';
  if (totalValuation >= 1_000_000_000_000) {
    formattedValuation = `$${(totalValuation / 1_000_000_000_000).toFixed(2)}`;
    valuationSuffix = 'Trillion';
  } else if (totalValuation >= 1_000_000_000) {
    formattedValuation = `$${(totalValuation / 1_000_000_000).toFixed(2)}`;
    valuationSuffix = 'Billion';
  } else if (totalValuation >= 1_000_000) {
    formattedValuation = `$${(totalValuation / 1_000_000).toFixed(2)}`;
    valuationSuffix = 'Million';
  }

  // Dynamic Metrics Rates
  const pastMonthAssets = assets.filter(a => {
    const d = new Date(a.date);
    return !isNaN(d.getTime()) && (d.getFullYear() < currentYear || (d.getFullYear() === currentYear && d.getMonth() < currentMonth));
  });
  const assetGrowth = pastMonthAssets.length === 0 ? 0 : ((assets.length - pastMonthAssets.length) / pastMonthAssets.length) * 100;
  const assetGrowthStr = assetGrowth > 0 ? `+${assetGrowth.toFixed(1)}` : assetGrowth.toFixed(1);

  const pastYearAssets = assets.filter(a => {
    const d = new Date(a.date);
    return !isNaN(d.getTime()) && d.getFullYear() < currentYear;
  });
  const pastYearValuation = pastYearAssets.reduce((sum, asset) => {
    const cost = asset.assetCost ? asset.assetCost.replace(/\D/g, '') : (asset.val || '').replace(/\D/g, '');
    return sum + (parseInt(cost) || 0);
  }, 0);
  const valuationGrowth = pastYearValuation === 0 ? 0 : ((totalValuation - pastYearValuation) / pastYearValuation) * 100;
  const valuationGrowthStr = valuationGrowth > 0 ? `+${valuationGrowth.toFixed(1)}` : valuationGrowth.toFixed(1);

  const damagedThisMonth = assets.filter(a => {
    const d = new Date(a.date);
    return a.conditionLevel === 'error' && !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const AssetTrendingIcon = assetGrowth >= 0 ? TrendingUp : TrendingDown;
  const ValuationTrendingIcon = valuationGrowth >= 0 ? TrendingUp : TrendingDown;

  // Calculate Subsiary Distribution
  const subsidiaryMap = assets.reduce((acc, asset) => {
    acc[asset.subsidiary] = (acc[asset.subsidiary] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const subsidiaryData = Object.keys(subsidiaryMap)
    .map(name => ({ name, value: subsidiaryMap[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Calculate Trend Data based on selectedYear
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendMap = assets.reduce((acc, asset) => {
    const d = new Date(asset.date);
    if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
      const m = d.getMonth();
      acc[m] = (acc[m] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);
  
  const trendData = months.map((month, idx) => ({
    month,
    value: trendMap[idx] || 0
  }));
  const categoryMap = assets.reduce((acc, asset) => {
    const category = asset.categorySegment1 || asset.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getCategoryColor = (name: string, index: number) => {
    if (categoryColors[name]) return categoryColors[name];
    const defaultColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];
    return defaultColors[index % defaultColors.length];
  };

  const categoryData = Object.keys(categoryMap)
    .map((name, index) => ({ 
      name, 
      value: categoryMap[name], 
      color: getCategoryColor(name, index)
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Overview Dashboard</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add New Asset</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant font-medium text-xs tracking-wider uppercase mb-3">
            <span>Total Keseluruhan Aset</span>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="text-4xl font-bold text-primary mb-2">{totalAssets.toLocaleString('id-ID')}</div>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <AssetTrendingIcon className={cn("h-4 w-4", assetGrowth >= 0 ? "text-emerald-500" : "text-error")} />
            <span className={cn("font-medium", assetGrowth >= 0 ? "text-emerald-500" : "text-error")}>{assetGrowthStr}%</span> dari bulan lalu
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant font-medium text-xs tracking-wider uppercase mb-3">
            <span>Total Valuasi Aset</span>
            <FileUp className="h-5 w-5 text-primary" />
          </div>
          <div className="text-4xl font-bold text-primary mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
            {formattedValuation}
            {valuationSuffix && <span className="text-xl ml-1 text-on-surface-variant font-semibold">{valuationSuffix}</span>}
          </div>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <ValuationTrendingIcon className={cn("h-4 w-4", valuationGrowth >= 0 ? "text-emerald-500" : "text-error")} />
            <span className={cn("font-medium", valuationGrowth >= 0 ? "text-emerald-500" : "text-error")}>{valuationGrowthStr}%</span> YoY
          </div>
        </div>

        <div className="rounded-xl border border-error/20 bg-error-container/5 p-5 flex flex-col shadow-sm border-l-4 border-l-error">
          <div className="flex items-center justify-between text-on-surface-variant font-medium text-xs tracking-wider uppercase mb-3">
            <span>Aset Rusak</span>
            <AlertTriangle className="h-5 w-5 text-error" />
          </div>
          <div className="text-4xl font-bold text-primary mb-2">{damagedAssets.toLocaleString('id-ID')}</div>
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <TrendingUp className="h-4 w-4 text-error" />
            <span className="text-error font-medium">+{damagedThisMonth}</span> bulan ini
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-primary mb-4">Top 5 Subsidiaries by Valuation</h3>
          <div className="h-64 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subsidiaryData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} 
                    tick={{ fill: '#45464d', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #c6c6cd' }} />
                  <Bar dataKey="value" fill="#0F172A" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="animate-pulse bg-surface-container-low w-full h-full rounded"></div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-primary mb-4">Asset Categories</h3>
          <div className="flex-1 min-h-[200px] relative">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="animate-pulse bg-surface-container-low w-full h-full rounded-full mx-auto" style={{ width: '160px', height: '160px' }}></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-primary">100%</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-primary">Tren Pembelian Aset Tahunan</h3>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-surface-container-low border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="h-72 w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e3e5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#76777d', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#76777d', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="value" stroke="#0F172A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="animate-pulse bg-surface-container-low w-full h-full rounded"></div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col mt-2">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="text-lg font-semibold text-primary">Recent Asset Additions</h3>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                <Download className="h-4 w-4" /> Export CSV
             </button>
             <Link to="/inventory" className="text-primary text-sm font-medium hover:underline px-2 flex items-center">View All</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-xs font-medium uppercase tracking-wider">
                <th className="p-3 pl-5">Asset Book</th>
                <th className="p-3">Asset Number</th>
                <th className="p-3">Asset Description</th>
                <th className="p-3 text-right">Asset Cost (Valuation)</th>
                <th className="p-3">Date Placed in Services</th>
                <th className="p-3 text-center">Asset Units</th>
                <th className="p-3">Asset Category Segment 2 (Location)</th>
                <th className="p-3">Depreciation Method</th>
                <th className="p-3 text-center">Life in Months</th>
                <th className="p-3 text-center">Listed</th>
                <th className="p-3 text-center pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/50">
              {recentAssets.slice(0, 5).map((asset) => (
                <tr key={asset.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3 pl-5 font-medium text-on-surface">
                    {asset.assetBook || '-'}
                  </td>
                  <td className="p-3">
                    <p className="font-mono text-xs text-on-surface-variant">{asset.assetNumber || asset.id}</p>
                  </td>
                  <td className="p-3 text-on-surface">
                    <p className="font-semibold">{asset.assetDescription || asset.name}</p>
                  </td>
                  <td className="p-3 text-right font-mono text-on-surface">
                    {formatCurrency(asset.assetCost || asset.val)}
                  </td>
                  <td className="p-3 text-on-surface-variant font-mono">
                    {asset.datePlacedInService || asset.date}
                  </td>
                  <td className="p-3 text-center text-on-surface">
                    {asset.assetUnits || '-'}
                  </td>
                  <td className="p-3 text-on-surface">
                    {asset.categorySegment2 || '-'}
                  </td>
                  <td className="p-3 text-on-surface">
                    {asset.depreciationMethod || '-'}
                  </td>
                  <td className="p-3 text-center text-on-surface">
                    {asset.lifeInMonths || '-'}
                  </td>
                  <td className="p-3 text-center">
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
                  <td className="p-3 text-center pr-5">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      ((asset.status || '').toLowerCase().includes('active') || (asset.status || '').toLowerCase().includes('good')) ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      ((asset.status || '').toLowerCase().includes('audited') || (asset.status || '').toLowerCase().includes('warning')) ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-surface-container text-on-surface-variant border-outline-variant'
                    )}>
                      {asset.status || asset.condition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
