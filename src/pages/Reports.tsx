import { ChevronRight, Play, Download, Table2, CheckCircle2, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAsset } from '../context/AssetContext';
import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { auth } from '../lib/firebase';

interface ReportLog {
  id: string;
  name: string;
  creator: string;
  date: string;
  status: 'Completed' | 'Processing';
}

export default function Reports() {
  const { assets } = useAsset();
  
  const [reportType, setReportType] = useState('Asset Valuation Summary');
  const [subsidiaryFilter, setSubsidiaryFilter] = useState('All Divisions');
  const [startDate, setStartDate] = useState('2019-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchMaintenance = async () => {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/api/maintenance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const records = await response.json();
          setMaintenanceRecords(records);
        }
      } catch (error) {
        console.error("Error fetching maintenance: ", error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchMaintenance();
      } else {
        setMaintenanceRecords([]);
      }
    });

    return () => unsubscribe();
  }, []);
  
  const [recentReports, setRecentReports] = useState<ReportLog[]>([]);
  
  const subsidiaries = Array.from(new Set(assets.map(a => a.subsidiary)));

  // Generate chart data on click
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);
  
  const handleGenerate = () => {
    // 1. Filter assets based on form
    const filtered = assets.filter(asset => {
      // Date filter
      const assetDate = new Date(asset.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const matchesDate = isNaN(assetDate.getTime()) ? true : (assetDate >= start && assetDate <= end);
      
      const matchesSub = subsidiaryFilter === 'All Divisions' || asset.subsidiary === subsidiaryFilter;
      
      return matchesDate && matchesSub;
    });
    setFilteredAssets(filtered);

    // 2. Aggregate data for graph based on type
    if (reportType === 'Asset Valuation Summary') {
      const agg: Record<string, number> = {};
      filtered.forEach(a => {
        const val = parseInt(a.val.replace(/[^0-9]/g, '')) || 0;
        agg[a.category] = (agg[a.category] || 0) + val;
      });
      const data = Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a,b) => b.value - a.value);
      setChartData(data);
    } else if (reportType === 'Maintenance Cost Analysis') {
       const agg: Record<string, number> = {};
       const relevantMaintenance = maintenanceRecords.filter(m => {
          const mDate = new Date(m.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          const matchesDate = isNaN(mDate.getTime()) ? true : (mDate >= start && mDate <= end);
          const matchesSub = subsidiaryFilter === 'All Divisions' || m.sub === subsidiaryFilter;
          return matchesDate && matchesSub;
       });
       relevantMaintenance.forEach(m => {
          const cost = parseInt((m.cost || '').replace(/[^0-9]/g, '')) || 0;
          agg[m.type] = (agg[m.type] || 0) + cost;
       });
       const data = Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a,b) => b.value - a.value);
       setChartData(data);
    } else {
      const agg: Record<string, number> = {};
      filtered.forEach(a => {
        const val = parseInt(a.val.replace(/[^0-9]/g, '')) || 0;
        const key = a.subsidiary;
        agg[key] = (agg[key] || 0) + val;
      });
      const data = Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a,b) => b.value - a.value);
      setChartData(data);
    }

    setIsGenerated(true);
  };
  
  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data available to export");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (format: string) => {
    let exportData: any[] = [];
    if (reportType === 'Maintenance Cost Analysis') {
       exportData = maintenanceRecords.filter(m => {
          const mDate = new Date(m.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          const matchesDate = isNaN(mDate.getTime()) ? true : (mDate >= start && mDate <= end);
          const matchesSub = subsidiaryFilter === 'All Divisions' || m.sub === subsidiaryFilter;
          return matchesDate && matchesSub;
       });
    } else {
       exportData = filteredAssets.map(({ id, name, subsidiary, category, date, val, condition, status }) => ({
         id, name, subsidiary, category, date, val, condition, status
       }));
    }

    if (format === 'Excel' || format === 'CSV') {
       generateCSV(exportData, `${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`);
    } else {
       alert(`Export to PDF is simulated. In a real app, this would generate a PDF document.`);
    }

    const newReport: ReportLog = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${reportType} (${subsidiaryFilter})`,
      creator: 'Current User',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Completed'
    };
    setRecentReports(prev => [newReport, ...prev]);
  };

  const formatYAxis = (val: number) => {
      if (val >= 1000000000) return `$${Math.round(val / 1000000000)}B`;
      if (val >= 1000000) return `$${Math.round(val / 1000000)}M`;
      return `$${val}`;
  }

  const formatTooltip = (val: number) => {
    return [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val), 'Valuation'];
  }

  return (
    <div className="flex flex-col gap-8 w-full min-h-[calc(100vh-140px)]">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-1">Advanced Reporting & Analytics</h2>
        <p className="text-base text-on-surface-variant max-w-2xl">Configure, preview, and export high-fidelity data extracts regarding asset valuation, maintenance cycles, and compliance status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* Left Side Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-on-surface border-b border-outline-variant pb-3 mb-5">Report Configuration</h3>
            <div className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-on-surface-variant">Report Type</label>
                <div className="relative">
                  <select 
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg py-2.5 px-3 appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  >
                    <option value="Asset Valuation Summary">Asset Valuation Summary</option>
                    <option value="Depreciation Schedule">Valuation by Subsidiary</option>
                    <option value="Maintenance Cost Analysis">Valuation by Status</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-on-surface-variant">Subsidiary / Division</label>
                <div className="relative">
                  <select 
                    value={subsidiaryFilter}
                    onChange={(e) => setSubsidiaryFilter(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg py-2.5 px-3 appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  >
                    <option value="All Divisions">All Divisions</option>
                    {subsidiaries.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-on-surface-variant">Date Range</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg py-2 px-1 sm:px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                  />
                  <span className="text-on-surface-variant">-</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg py-2 px-1 sm:px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleGenerate}
                className="mt-2 bg-primary text-on-primary font-medium text-sm py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity w-full flex justify-center items-center gap-2 shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" /> Generate Preview
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Export Options</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleExport('PDF')}
                disabled={!isGenerated}
                className="bg-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity w-full flex justify-center items-center gap-2 shadow-sm"
              >
                <Download className="h-4 w-4" /> Download as PDF
              </button>
              <button 
                onClick={() => handleExport('Excel')}
                disabled={!isGenerated}
                className="bg-surface-container-lowest disabled:opacity-50 disabled:border-outline-variant/50 disabled:text-on-surface-variant disabled:hover:bg-transparent border border-outline text-primary font-medium text-sm py-2.5 px-4 rounded-lg hover:bg-surface-container-low transition-colors w-full flex justify-center items-center gap-2"
              >
                <Table2 className="h-4 w-4" /> Export to Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
            <div className="w-full flex justify-between items-center border-b border-outline-variant pb-3 mb-6">
              <h3 className="text-lg font-semibold text-on-surface">Live Preview: {reportType}</h3>
              {isGenerated && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Sync Complete
                </div>
              )}
            </div>
            
            <div className="w-full h-[350px]">
              {isGenerated ? (
                chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e3e5" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#45464d', fontSize: 12 }} 
                        dy={10} 
                      />
                      <YAxis 
                        tickFormatter={formatYAxis} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#76777d', fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip 
                        formatter={formatTooltip}
                        cursor={{ fill: '#f2f4f6' }} 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #c6c6cd', fontSize: '13px' }} 
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                       {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0F172A' : '#515f74'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-on-surface-variant italic">
                    No data found for the selected filters.
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center w-full h-full text-on-surface-variant flex-col gap-3">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                    <BarChart2 className="h-6 w-6 text-outline" />
                  </div>
                  <span>Configure options and click 'Generate Preview'</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-semibold text-on-surface">Recent Reports</h3>
              <button className="text-sm font-semibold text-primary hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-surface border-b border-outline-variant">
                  <tr>
                    <th className="py-3 px-5 text-xs font-medium text-on-surface-variant">Report Name</th>
                    <th className="py-3 px-5 text-xs font-medium text-on-surface-variant">Created By</th>
                    <th className="py-3 px-5 text-xs font-medium text-on-surface-variant">Date</th>
                    <th className="py-3 px-5 text-xs font-medium text-on-surface-variant">Status</th>
                    <th className="py-3 px-5 text-xs font-medium text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-outline-variant/40">
                  {recentReports.map((report, idx) => (
                    <tr key={report.id} className={cn("transition-colors", idx % 2 === 0 ? "hover:bg-surface-container-lowest" : "bg-surface hover:bg-surface-container-low")}>
                      <td className="py-4 px-5 font-medium text-on-surface">{report.name}</td>
                      <td className="py-4 px-5 text-on-surface-variant">{report.creator}</td>
                      <td className="py-4 px-5 font-mono text-xs text-on-surface-variant">{report.date}</td>
                      <td className="py-4 px-5">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                          report.status === 'Completed' ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-blue-100 text-blue-800 border-blue-200"
                        )}>
                           {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                         <button 
                           onClick={() => alert(`Downloading ${report.name}`)}
                           className={cn("p-1", report.status === 'Completed' ? "text-on-surface-variant hover:text-primary" : "text-on-surface-variant/50 cursor-not-allowed")}
                           disabled={report.status !== 'Completed'}
                          >
                           <Download className="h-4 w-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
