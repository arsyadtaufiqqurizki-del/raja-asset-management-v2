import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAsset, Asset } from '../context/AssetContext';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  rowNumber: number;
  id: string;
  name: string;
  subsidiary: string;
  category: string;
  date: string;
  val: string;
  originalVal: string;
  condition: string;
  status: string;
  assetNumber?: string;
  assetDescription?: string;
  assetCost?: string;
  datePlacedInService?: string;
  listedStatus?: string;
  assetBook?: string;
  serialNumber?: string;
  assetType?: string;
  prorateConvention?: string;
  assetUnits?: string;
  categorySegment1?: string;
  categorySegment2?: string;
  categorySegment3?: string;
  keySegment1?: string;
  keySegment2?: string;
  keySegment3?: string;
  amortizationStartDate?: string;
  depreciationMethod?: string;
  lifeInMonths?: string;
  costClearingAccount1?: string;
  costClearingAccount2?: string;
  costClearingAccount3?: string;
  costClearingAccount4?: string;
  costClearingAccount5?: string;
  costClearingAccount6?: string;
  costClearingAccount7?: string;
  costClearingAccount8?: string;
  listed?: string;
}

interface FailedRow extends ParsedRow {
  errorMessage: string;
}

export default function ImportExcelModal({ isOpen, onClose }: ImportExcelModalProps) {
  const { addAssetsBulk } = useAsset();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [failedRows, setFailedRows] = useState<FailedRow[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, batch: 0, totalBatches: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setSuccessCount(null);
    setFailedRows([]);
    setProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid Excel or CSV file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccessCount(null);
    setFailedRows([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Find header row — scan first 10 rows for 'Asset Book' or 'Asset Number' or 'Asset Description'
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i] || [];
          const rowStr = row.map((c: any) => String(c || '').trim().toLowerCase()).join(',');
          if (rowStr.includes('asset book') || rowStr.includes('asset number') || rowStr.includes('asset description')) {
            headerRowIndex = i;
            break;
          }
        }

        const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex }) as any[];

        // Map excel columns to our data structure
        const mappedData: ParsedRow[] = data.map((row, idx) => ({
          rowNumber: idx + headerRowIndex + 2, // Accounting for header row position
          id: row['Asset Number'] || row['id'] || `AST-IMPORTED-${idx}`,
          name: row['Asset Description'] || row['Asset Description '] || row['Asset Name'] || row['name'] || row['Name'] || '',
          assetNumber: row['Asset Number'] || row['id'] || `AST-IMPORTED-${idx}`,
          assetDescription: row['Asset Description'] || row['Asset Description '] || row['Asset Name'] || row['name'] || row['Name'] || '',
          assetCost: String(row['Asset Cost'] || row['Value'] || row['Valuation'] || row['val'] || row['Val'] || ''),
          datePlacedInService: excelSerialToDate(row['Date Placed in Service'] || row['Purchase Date'] || row['date'] || row['Date'] || ''),
          listedStatus: row['Listed Status'] || row['listedStatus'] || '',
          subsidiary: row['Subsidiary'] || row['subsidiary'] || 'Unknown Subsidiary',
          category: row['Category'] || row['category'] || 'General',
          date: excelSerialToDate(row['Date Placed in Service'] || row['Purchase Date'] || row['date'] || row['Date'] || '') || new Date().toISOString().split('T')[0],
          originalVal: String(row['Asset Cost'] || row['Value'] || row['Valuation'] || row['val'] || row['Val'] || ''),
          val: String(row['Asset Cost'] || row['Value'] || row['Valuation'] || row['val'] || row['Val'] || '0').replace(/[^0-9]/g, ''),
          condition: row['Condition'] || row['condition'] || 'Good',
          status: row['Status'] || row['status'] || 'Active',
          assetBook: row['Asset Book'] || '',
          serialNumber: row['Serial Number'] || '',
          assetType: row['Asset Type'] || '',
          prorateConvention: row['Prorate Convention'] || '',
          assetUnits: row['Asset Units'] || '1',
          categorySegment1: row['Asset Category Segment1'] || '',
          categorySegment2: row['Asset Category Segment2'] || '',
          categorySegment3: row['Asset Category Segment3'] || '',
          keySegment1: row['Asset Key Segment1'] || '',
          keySegment2: row['Asset Key Segment2'] || '',
          keySegment3: row['Asset Key Segment3'] || '',
          amortizationStartDate: excelSerialToDate(row['Amortization Start Date'] || ''),
          depreciationMethod: row['Depreciation Method '] || row['Depreciation Method'] || '',
          lifeInMonths: row['Life in Months'] || '',
          costClearingAccount1: row['Cost Clearing Account Segment1'] || '',
          costClearingAccount2: row['Cost Clearing Account Segment2'] || '',
          costClearingAccount3: row['Cost Clearing Account Segment3'] || '',
          costClearingAccount4: row['Cost Clearing Account Segment4'] || '',
          costClearingAccount5: row['Cost Clearing Account Segment5'] || '',
          costClearingAccount6: row['Cost Clearing Account Segment6'] || '',
          costClearingAccount7: row['Cost Clearing Account Segment7'] || '',
          costClearingAccount8: row['Cost Clearing Account Segment8'] || '',
          listed: row['Listed'] || '',
        }));

        setParsedData(mappedData);
      } catch (err) {
        setError('Failed to parse file. Please ensure it is a valid Excel file.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const excelSerialToDate = (serial: any): string => {
    if (!serial) return '';
    if (serial instanceof Date) {
      return serial.toISOString().split('T')[0];
    }
    const num = Number(serial);
    if (isNaN(num) || num < 1) return String(serial);
    // Excel serial date: days since 1900-01-01 (with leap year bug)
    const utcDays = Math.floor(num - 25569);
    const utcValue = utcDays * 86400;
    const date = new Date(utcValue * 1000);
    return date.toISOString().split('T')[0];
  };

  const determineConditionLevel = (condition: string): Asset['conditionLevel'] => {
    const c = (condition || '').toLowerCase();
    if (c.includes('good') || c.includes('excellent') || c.includes('new')) return 'good';
    if (c.includes('fair') || c.includes('warning') || c.includes('maintenance')) return 'warning';
    return 'error';
  };

  const determineStatusLevel = (status: string): Asset['statusLevel'] => {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('success') || s.includes('deployed')) return 'success';
    if (s.includes('idle') || s.includes('warning') || s.includes('repair')) return 'warning';
    if (s.includes('retired') || s.includes('error') || s.includes('broken')) return 'error';
    return 'neutral';
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const validRows: Asset[] = [];
      const invalidRows: FailedRow[] = [];
      
      const seenNames = new Set<string>();

      // Validate data
      parsedData.forEach(row => {
        let errorMessage = '';

        const descStr = String(row.assetDescription || row.name || '');
        const costStr = String(row.assetCost || row.originalVal || '');
        const costNum = Number(costStr.replace(/[^0-9]/g, ''));
        if (!descStr.trim()) {
          errorMessage = 'Asset Description kosong.';
        } else if (seenNames.has(descStr.toLowerCase())) {
          errorMessage = 'Duplikat (Asset Description sudah ada di file ini).';
        } else if (!costStr || isNaN(costNum)) {
          errorMessage = 'Format Asset Cost salah / tidak valid.';
        } else if (costNum <= 0) {
          errorMessage = 'Asset Cost harus lebih besar dari 0.';
        }

        if (errorMessage) {
          invalidRows.push({ ...row, errorMessage });
        } else {
          seenNames.add(descStr.toLowerCase());
          validRows.push({
            id: row.id,
            name: row.name,
            assetNumber: row.assetNumber,
            assetDescription: row.assetDescription,
            assetCost: row.assetCost,
            datePlacedInService: row.datePlacedInService,
            listedStatus: row.listedStatus,
            subsidiary: row.subsidiary,
            category: row.category,
            date: row.date,
            val: row.val,
            condition: row.condition,
            conditionLevel: determineConditionLevel(row.condition),
            status: row.status,
            statusLevel: determineStatusLevel(row.status),
            assetBook: row.assetBook,
            serialNumber: row.serialNumber,
            assetType: row.assetType,
            prorateConvention: row.prorateConvention,
            assetUnits: row.assetUnits ? Number(row.assetUnits) : undefined,
            categorySegment1: row.categorySegment1,
            categorySegment2: row.categorySegment2,
            categorySegment3: row.categorySegment3,
            keySegment1: row.keySegment1,
            keySegment2: row.keySegment2,
            keySegment3: row.keySegment3,
            amortizationStartDate: row.amortizationStartDate,
            depreciationMethod: row.depreciationMethod,
            lifeInMonths: row.lifeInMonths ? Number(row.lifeInMonths) : undefined,
            costClearingAccount1: row.costClearingAccount1,
            costClearingAccount2: row.costClearingAccount2,
            costClearingAccount3: row.costClearingAccount3,
            costClearingAccount4: row.costClearingAccount4,
            costClearingAccount5: row.costClearingAccount5,
            costClearingAccount6: row.costClearingAccount6,
            costClearingAccount7: row.costClearingAccount7,
            costClearingAccount8: row.costClearingAccount8,
            listed: row.listed,
          });
        }
      });

      setFailedRows(invalidRows);

      // Chunk the upload — auto-split per 100 baris agar payload tidak melebihi body limit
      const CHUNK_SIZE = 100;
      const totalBatches = Math.ceil(validRows.length / CHUNK_SIZE);
      setProgress({ current: 0, total: validRows.length, batch: 0, totalBatches });

      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + CHUNK_SIZE);
        const currentBatch = Math.floor(i / CHUNK_SIZE) + 1;
        await addAssetsBulk(chunk);
        setProgress(prev => ({
          ...prev,
          current: Math.min(i + CHUNK_SIZE, validRows.length),
          batch: currentBatch
        }));
      }

      setSuccessCount(validRows.length);
    } catch (err) {
      console.error(err);
      setError('Failed to import assets. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportErrors = () => {
    const dataToExport = failedRows.map(r => ({
      'Row Segment': r.rowNumber,
      'Error Reason': r.errorMessage,
      'Asset Number': r.assetNumber || r.id,
      'Asset Description': r.assetDescription || r.name,
      'Subsidiary': r.subsidiary,
      'Asset Cost': r.assetCost || r.originalVal,
      'Date Placed in Service': r.datePlacedInService || r.date,
      'Condition': r.condition,
      'Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Imports");

    XLSX.writeFile(workbook, `Import_Errors_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-outline-variant">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Import Excel Data</h2>
            <p className="text-sm text-on-surface-variant mt-1">Upload an Excel or CSV file to bulk import assets.</p>
          </div>
          <button onClick={handleClose} disabled={isUploading} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {successCount !== null ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Import Report</h3>
              <p className="text-on-surface-variant text-center mb-6">
                Berhasil mengimpor <strong>{successCount}</strong> data.
                {failedRows.length > 0 && (
                  <span className="text-error font-medium ml-1">
                    Gagal {failedRows.length} data.
                  </span>
                )}
              </p>

              {failedRows.length > 0 && (
                <div className="w-full bg-error-container/20 border border-error-container p-4 rounded-xl mb-6 flex items-start gap-4">
                  <div className="p-2 bg-error-container text-on-error-container rounded-lg shrink-0">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-on-surface text-sm mb-1">Sebagian Data Gagal Diimpor</h4>
                    <p className="text-xs text-on-surface-variant mb-3">
                      Terdapat {failedRows.length} baris dengan format harga salah atau terindikasi duplikat. Unduh laporan file untuk memperbaikinya.
                    </p>
                    <button
                      onClick={handleExportErrors}
                      className="text-sm bg-surface border border-outline-variant px-3 py-1.5 rounded-lg font-medium hover:bg-surface-container flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Error Data
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={handleClose}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {!file ? (
                <div 
                  className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-surface-container-lowest hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                  />
                  <div className="p-4 bg-surface-container rounded-full text-primary mb-4">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface mb-1">Click to upload or drag and drop</h3>
                  <p className="text-sm text-on-surface-variant max-w-md">
                    Supported formats: .xlsx, .xls, .csv. <br/>
                    Ensure your file contains columns for: Asset Book, Asset Number, Asset Description, Asset Cost, Date Placed in Service, Depreciation Method, Life in Months, and others. Use the Export feature on an existing asset to see the full column template.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface text-sm">{file.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {(file.size / 1024).toFixed(2)} KB • {parsedData.length} records found
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button 
                        onClick={resetState}
                        className="text-sm font-medium text-error hover:text-error/80 px-3 py-1.5"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-error-container/30 text-on-error-container rounded-lg text-sm border border-error/20">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {isUploading && progress.total > 0 && (
                    <div className="mt-2 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-on-surface">Mengimpor Data...</span>
                        <span className="text-sm font-medium text-primary">
                          {Math.round((progress.current / progress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-on-surface-variant">
                          Batch {progress.batch}/{progress.totalBatches}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {progress.current.toLocaleString()} of {progress.total.toLocaleString()} baris
                        </p>
                      </div>
                    </div>
                  )}

                  {parsedData.length > 0 && !isUploading && (
                    <div className="border border-outline-variant rounded-lg overflow-hidden flex flex-col max-h-[300px]">
                      <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant">
                        <p className="text-xs font-semibold text-on-surface uppercase tracking-wider">Data Preview</p>
                      </div>
                      <div className="overflow-auto flex-1 bg-surface-container-lowest">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-surface-container sticky top-0">
                            <tr>
                              <th className="px-4 py-2 font-medium text-on-surface-variant border-b border-outline-variant">Asset Number</th>
                              <th className="px-4 py-2 font-medium text-on-surface-variant border-b border-outline-variant">Asset Description</th>
                              <th className="px-4 py-2 font-medium text-on-surface-variant border-b border-outline-variant">Category Seg. 1</th>
                              <th className="px-4 py-2 font-medium text-on-surface-variant border-b border-outline-variant">Asset Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant">
                            {parsedData.slice(0, 5).map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-on-surface truncate max-w-[150px]">{row.assetNumber || row.id || '-'}</td>
                                <td className="px-4 py-2 text-on-surface-variant">{row.assetDescription || row.name || '-'}</td>
                                <td className="px-4 py-2 text-on-surface-variant">{row.categorySegment1 || row.category || '-'}</td>
                                <td className="px-4 py-2 text-on-surface-variant font-mono">{row.assetCost || row.originalVal || '-'}</td>
                              </tr>
                            ))}
                            {parsedData.length > 5 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-3 text-center text-xs text-on-surface-variant italic cursor-pointer hover:bg-surface-container/50">
                                  ...and {parsedData.length - 5} more rows
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {successCount === null && (
          <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
            <button 
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg font-medium text-sm text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              disabled={!file || parsedData.length === 0 || isUploading}
              className="px-6 py-2 rounded-lg font-medium text-sm bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  Mengimpor...
                </>
              ) : (
                'Import Data'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
