# Plan: Penyesuaian Import/Export CSV ke Format Baru

> **Status**: Implementasi Tahap 1 & 2 Selesai  
> **Scope**: Asset Inventory — Fitur Import & Export CSV/Excel  
> **Mode**: Plan Only — Tidak ada perubahan kode sebelum disetujui

---

## Pemahaman Arsitektur & Alur Data (dari AGENTS.md + server.ts + schema.ts)

### Stack & Alur Lengkap

```
[User Upload CSV]
       │
       ▼
[ImportExcelModal.tsx]  ← parse XLSX/CSV di browser (via xlsx library)
       │  mapping kolom → ParsedRow[]
       │  validasi client-side
       ▼
[AssetContext.tsx → addAssetsBulk()]
       │  kirim payload ke:
       │  POST /api/assets/bulk
       │  Header: Authorization: Bearer <Firebase ID Token>
       ▼
[server.ts — Express Backend]
       │  requireAuth middleware → verifikasi Firebase token
       │  sanitize integer fields (lifeInMonths, assetUnits)
       │  map legacy 'id' → assetId, hapus serial PK 'id'
       ▼
[Drizzle ORM → db.transaction → db.insert(assets)]
       │
       ▼
[Cloud SQL PostgreSQL — tabel: assets]
```

```
[User klik Export]
       │
       ▼
[Inventory.tsx → handleExport()]
       │  ambil dari state: filteredAssets (sudah di-fetch dari DB via AssetContext)
       │  map ke object kolom
       ▼
[XLSX.utils.json_to_sheet → writeFile()]  ← generate file di browser
       │
       ▼
[File .xlsx terunduh langsung — tidak ada API call]
```

### Penting: Tidak Ada Perubahan Schema/Server

> **Semua field extended sudah ada** di `schema.ts` dan sudah di-handle `server.ts`.  
> Import/Export hanya menyentuh **layer frontend** (`Inventory.tsx` + `ImportExcelModal.tsx`).  
> **Tidak perlu** `npm run db:push` atau kunjungi `/api/migrate`.

---

## Pemetaan: `schema.ts` ↔ Kolom CSV

Ini adalah acuan satu-satu antara kolom database dan nama kolom yang harus ada di file CSV Import/Export:

| Kolom di `schema.ts` | Nama Kolom CSV (standar) | Tipe DB |
|---|---|---|
| `assetId` | *(internal, auto-generate)* | `text UNIQUE` |
| `assetBook` | `Asset Book` | `text` |
| `assetNumber` | `Asset Number` | `text` |
| `assetDescription` | `Asset Description` | `text` |
| `serialNumber` | `Serial Number` | `text` |
| `assetType` | `Asset Type` | `text` |
| `subsidiary` | `Subsidiary` | `text` |
| `prorateConvention` | `Prorate Convention` | `text` |
| `assetUnits` | `Asset Units` | `integer` (default 1) |
| `categorySegment1` | `Asset Category Segment1` | `text` |
| `categorySegment2` | `Asset Category Segment2` | `text` |
| `categorySegment3` | `Asset Category Segment3` | `text` |
| `keySegment1` | `Asset Key Segment1` | `text` |
| `keySegment2` | `Asset Key Segment2` | `text` |
| `keySegment3` | `Asset Key Segment3` | `text` |
| `assetCost` | `Asset Cost` | `text` (IDR string) |
| `datePlacedInService` | `Date Placed in Service` | `text` |
| `amortizationStartDate` | `Amortization Start Date` | `text` |
| `depreciationMethod` | `Depreciation Method` | `text` |
| `lifeInMonths` | `Life in Months` | `integer` |
| `costClearingAccount1` | `Cost Clearing Account Segment1` | `text` |
| `costClearingAccount2` | `Cost Clearing Account Segment2` | `text` |
| `costClearingAccount3` | `Cost Clearing Account Segment3` | `text` |
| `costClearingAccount4` | `Cost Clearing Account Segment4` | `text` |
| `costClearingAccount5` | `Cost Clearing Account Segment5` | `text` |
| `costClearingAccount6` | `Cost Clearing Account Segment6` | `text` |
| `costClearingAccount7` | `Cost Clearing Account Segment7` | `text` |
| `costClearingAccount8` | `Cost Clearing Account Segment8` | `text` |
| `listed` | `Listed` | `text` |
| `listedStatus` | `Listed Status` | `text` (`Listed` / `Non-Listed` / `Audited`) |
| `condition` | `Condition` | `text` |
| `status` | `Status` | `text` |
| *(legacy)* `name` | `Asset Name` *(fallback)* | `text` |
| *(legacy)* `val` | `Value` *(fallback)* | `text` |
| *(legacy)* `date` | `Purchase Date` *(fallback)* | `text` |
| *(legacy)* `category` | `Category` *(fallback)* | `text` |

### Catatan Validasi di Server (`server.ts`)
- `lifeInMonths` → diparse `parseInt`, jika NaN atau ≤ 0 → disimpan `null`
- `assetUnits` → diparse `parseInt`, jika NaN atau ≤ 0 → default `1`
- `assetId` → **harus unik** di DB (constraint `UNIQUE`). Jika duplikat → server return error `23505`
- `assetNumber` → bisa dipakai sebagai identifier alternatif (tapi tidak ada UNIQUE constraint di schema)
- `id` (serial PK) → **tidak boleh dikirim** dari frontend, server otomatis hapus sebelum insert

---

## Analisis Gap

### 1. Export — `handleExport()` di `Inventory.tsx` (baris 75–92)

| Kolom Saat Ini | Field Sumber | Masalah |
|---|---|---|
| `Asset ID` | `asset.id` | ❌ Harus `Asset Number` dari `asset.assetNumber` |
| `Name` | `asset.name` | ❌ Harus `Asset Description` dari `asset.assetDescription` |
| `Category` | `categorySegment1 \|\| category` | ❌ Hanya 1 segment, banyak field hilang |
| `Purchase Date` | `asset.date` | ❌ Harus `Date Placed in Service` dari `asset.datePlacedInService` |
| `Value (USD)` | `asset.val` | ❌ Harus `Asset Cost` (IDR) dari `asset.assetCost` |
| ❌ Tidak ada | — | `assetBook`, `serialNumber`, `assetType` |
| ❌ Tidak ada | — | `prorateConvention`, `assetUnits` |
| ❌ Tidak ada | — | `categorySegment1/2/3`, `keySegment1/2/3` |
| ❌ Tidak ada | — | `amortizationStartDate`, `depreciationMethod`, `lifeInMonths` |
| ❌ Tidak ada | — | `costClearingAccount1` s/d `8` |
| ❌ Tidak ada | — | `listedStatus`, `listed` |

**Dampak**: File export tidak bisa langsung di-reimport karena kolom berbeda dengan yang diharapkan import.

### 2. Import — `ImportExcelModal.tsx`

| Komponen | Masalah |
|---|---|
| `ParsedRow` interface | Tidak punya `assetNumber`, `assetDescription`, `assetCost`, `datePlacedInService`, `listedStatus` sebagai field eksplisit |
| Column mapping (`mappedData`) | Field baru sebagian ada, tapi `id`/`name`/`date`/`val` masih jadi primary source |
| Validasi `handleImport` | Validasi pakai `row.name` (lama), seharusnya `row.assetDescription` atau `row.assetNumber` |
| `validRows.push()` | `assetNumber`, `assetDescription`, `assetCost`, `datePlacedInService`, `listedStatus` tidak di-push ke payload |
| `handleExportErrors` | Kolom error export masih format lama (`Asset Name`, `Purchase Date`, `Value`) |
| Data Preview table | Kolom preview: Name / Subsidiary / Category / Value (lama) — tidak relevan |
| Hint text UI | Masih menyebut kolom lama (`Asset Name, Subsidiary, Category, Purchase Date, Value`) |

---

## Perubahan yang Akan Dilakukan

### File 1: `src/pages/Inventory.tsx` — fungsi `handleExport`

```diff
  const handleExport = () => {
    const dataToExport = filteredAssets.map(asset => ({
-     'Asset ID': asset.id,
-     'Name': asset.name,
-     'Subsidiary': asset.subsidiary,
-     'Category': asset.categorySegment1 || asset.category,
-     'Purchase Date': asset.date,
-     'Value (USD)': parseInt(String(asset.val || '').replace(/[^0-9]/g, '')) || 0,
-     'Condition': asset.condition,
-     'Status': asset.status
+     'Asset Book': asset.assetBook || '',
+     'Asset Number': asset.assetNumber || asset.id,
+     'Asset Description': asset.assetDescription || asset.name,
+     'Serial Number': asset.serialNumber || '',
+     'Asset Type': asset.assetType || '',
+     'Subsidiary': asset.subsidiary || '',
+     'Prorate Convention': asset.prorateConvention || '',
+     'Asset Units': asset.assetUnits ?? '',
+     'Asset Category Segment1': asset.categorySegment1 || '',
+     'Asset Category Segment2': asset.categorySegment2 || '',
+     'Asset Category Segment3': asset.categorySegment3 || '',
+     'Asset Key Segment1': asset.keySegment1 || '',
+     'Asset Key Segment2': asset.keySegment2 || '',
+     'Asset Key Segment3': asset.keySegment3 || '',
+     'Asset Cost': asset.assetCost || asset.val || '',
+     'Date Placed in Service': asset.datePlacedInService || asset.date || '',
+     'Amortization Start Date': asset.amortizationStartDate || '',
+     'Depreciation Method': asset.depreciationMethod || '',
+     'Life in Months': asset.lifeInMonths ?? '',
+     'Cost Clearing Account Segment1': asset.costClearingAccount1 || '',
+     'Cost Clearing Account Segment2': asset.costClearingAccount2 || '',
+     'Cost Clearing Account Segment3': asset.costClearingAccount3 || '',
+     'Cost Clearing Account Segment4': asset.costClearingAccount4 || '',
+     'Cost Clearing Account Segment5': asset.costClearingAccount5 || '',
+     'Cost Clearing Account Segment6': asset.costClearingAccount6 || '',
+     'Cost Clearing Account Segment7': asset.costClearingAccount7 || '',
+     'Cost Clearing Account Segment8': asset.costClearingAccount8 || '',
+     'Listed': asset.listed || '',
+     'Listed Status': asset.listedStatus || '',
+     'Condition': asset.condition || '',
+     'Status': asset.status || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
-   XLSX.writeFile(workbook, `Asset_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
+   XLSX.writeFile(workbook, `Asset_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
```

---

### File 2: `src/components/ImportExcelModal.tsx`

#### 2a. `ParsedRow` interface — tambah field baru eksplisit

```diff
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
+   assetNumber?: string;
+   assetDescription?: string;
+   assetCost?: string;
+   datePlacedInService?: string;
+   listedStatus?: string;
    assetBook?: string;
    // ... field lainnya tetap tidak berubah
  }
```

#### 2b. Column mapping `mappedData` — perkuat mapping ke field baru

```diff
  const mappedData: ParsedRow[] = data.map((row, idx) => ({
    rowNumber: idx + 2,
-   id: row['Asset Number'] || row['id'] || `AST-IMPORTED-${idx}`,
-   name: row['Asset Description '] || row['Asset Name'] || row['name'] || row['Name'] || '',
+   id: row['Asset Number'] || row['id'] || `AST-IMPORTED-${idx}`,
+   name: row['Asset Description'] || row['Asset Description '] || row['Asset Name'] || row['name'] || row['Name'] || '',
+   assetNumber: row['Asset Number'] || row['id'] || `AST-IMPORTED-${idx}`,
+   assetDescription: row['Asset Description'] || row['Asset Description '] || row['Asset Name'] || row['name'] || row['Name'] || '',
+   assetCost: String(row['Asset Cost'] || row['Value'] || row['val'] || row['Val'] || ''),
+   datePlacedInService: row['Date Placed in Service'] || row['Purchase Date'] || row['date'] || row['Date'] || '',
+   listedStatus: row['Listed Status'] || row['listedStatus'] || '',
    // ... field lainnya tetap
  }));
```

#### 2c. Validasi `handleImport` — pakai `assetDescription` sebagai identifier

```diff
- const nameStr = String(row.name || '');
- if (!nameStr.trim()) {
-   errorMessage = 'Nama aset kosong.';
- } else if (seenNames.has(nameStr.toLowerCase())) {
-   errorMessage = 'Duplikat (nama aset sudah ada di file ini).';
- } else if (!row.originalVal || isNaN(Number(String(row.originalVal).replace(/[^0-9]/g, '')))) {
-   errorMessage = 'Format harga salah / tidak valid.';
- } else if (Number(row.val) <= 0) {
-   errorMessage = 'Harga harus lebih besar dari 0.';
- }

+ const descStr = String(row.assetDescription || row.name || '');
+ const costStr = String(row.assetCost || row.originalVal || '');
+ const costNum = Number(costStr.replace(/[^0-9]/g, ''));
+ if (!descStr.trim()) {
+   errorMessage = 'Asset Description kosong.';
+ } else if (seenNames.has(descStr.toLowerCase())) {
+   errorMessage = 'Duplikat (Asset Description sudah ada di file ini).';
+ } else if (!costStr || isNaN(costNum)) {
+   errorMessage = 'Format Asset Cost salah / tidak valid.';
+ } else if (costNum <= 0) {
+   errorMessage = 'Asset Cost harus lebih besar dari 0.';
+ }
```

#### 2d. `validRows.push()` — tambah field baru ke payload Asset

```diff
  validRows.push({
    id: row.id,
    name: row.name,
+   assetNumber: row.assetNumber,
+   assetDescription: row.assetDescription,
+   assetCost: row.assetCost,
+   datePlacedInService: row.datePlacedInService,
+   listedStatus: row.listedStatus,
    subsidiary: row.subsidiary,
    category: row.category,
    date: row.date,
    val: row.val,
    // ... field lainnya tetap
  });
```

#### 2e. `handleExportErrors` — update kolom error report ke format baru

```diff
  const dataToExport = failedRows.map(r => ({
    'Row Segment': r.rowNumber,
    'Error Reason': r.errorMessage,
-   'Asset Name': r.name,
-   'Subsidiary': r.subsidiary,
-   'Category': r.category,
-   'Purchase Date': r.date,
-   'Value': r.originalVal,
-   'Condition': r.condition,
-   'Status': r.status
+   'Asset Number': r.assetNumber || r.id,
+   'Asset Description': r.assetDescription || r.name,
+   'Subsidiary': r.subsidiary,
+   'Asset Cost': r.assetCost || r.originalVal,
+   'Date Placed in Service': r.datePlacedInService || r.date,
+   'Condition': r.condition,
+   'Status': r.status,
  }));
```

#### 2f. Data Preview table — update kolom preview ke field relevan

```diff
  <thead>
    <tr>
-     <th>Name</th>
-     <th>Subsidiary</th>
-     <th>Category</th>
-     <th>Value</th>
+     <th>Asset Number</th>
+     <th>Asset Description</th>
+     <th>Category Seg. 1</th>
+     <th>Asset Cost</th>
    </tr>
  </thead>
  <tbody>
    {parsedData.slice(0, 5).map((row, idx) => (
      <tr key={idx}>
-       <td>{row.name || '-'}</td>
-       <td>{row.subsidiary}</td>
-       <td>{row.category}</td>
-       <td>{row.originalVal}</td>
+       <td>{row.assetNumber || row.id || '-'}</td>
+       <td>{row.assetDescription || row.name || '-'}</td>
+       <td>{row.categorySegment1 || row.category || '-'}</td>
+       <td>{row.assetCost || row.originalVal || '-'}</td>
      </tr>
    ))}
  </tbody>
```

#### 2g. Hint text UI — update panduan kolom

```diff
- Ensure your file contains columns for Asset Name, Subsidiary, Category, Purchase Date, Value, Condition, Status.
+ Ensure your file contains columns for: Asset Book, Asset Number, Asset Description, Asset Cost,
+   Date Placed in Service, Depreciation Method, Life in Months, and others. 
+   Use the Export feature on an existing asset to see the full column template.
```

---

## Urutan Eksekusi

1. ✅ **Edit `src/pages/Inventory.tsx`** — update `handleExport` (field mapping)
2. ✅ **Edit `src/components/ImportExcelModal.tsx`** — update `ParsedRow`, `mappedData`, validasi, `validRows.push()`, `handleExportErrors`, preview table, hint text

> **Tidak ada perubahan pada:**
> - `server.ts` — sudah handle semua field extended
> - `schema.ts` — sudah lengkap, tidak perlu migrasi baru
> - `AssetContext.tsx` — sudah mapping semua field
> - Tidak perlu `npm run db:push` atau kunjungi `/api/migrate`

---

## Catatan Koneksi Database & Validasi

| Layer | Peran | Relevansi ke Import/Export |
|---|---|---|
| **`schema.ts`** | Definisi tabel PostgreSQL via Drizzle ORM | Semua field sudah ada — tidak perlu ubah |
| **`server.ts` POST `/api/assets/bulk`** | Terima array asset, sanitize int fields, insert ke DB via transaction | Field `assetNumber`, `assetDescription`, dll. sudah diterima server |
| **`server.ts` requireAuth** | Verifikasi Firebase token di setiap request | Import sudah kirim token via `AssetContext.addAssetsBulk()` |
| **`AssetContext.addAssetsBulk()`** | Map `Asset[]` → payload JSON → POST `/api/assets/bulk` | Field baru (`assetNumber`, dll.) sudah ada di mapping payload |
| **`ImportExcelModal.tsx`** | Parse CSV → `validRows: Asset[]` → panggil `addAssetsBulk` | **INI YANG PERLU DIFIX**: field baru belum di-push ke `validRows` |
| **`Inventory.tsx` handleExport** | Ambil `filteredAssets` dari state (sudah dari DB) → tulis XLSX | **INI YANG PERLU DIFIX**: mapping kolom masih format lama |

### Alur Duplikat `assetId` (Perlu Diperhatikan)
Server meng-enforce `UNIQUE` constraint pada `asset_id` (bukan `asset_number`).  
Jika file CSV diimport ulang dengan baris yang sama, server akan return error `23505`.  
Validasi client-side saat ini hanya cek duplikat **dalam file**, bukan duplikat **dengan database**.  
→ **Tidak akan diubah** di scope ini (validasi server sudah cukup, error akan muncul di catch block).

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| File CSV lama tidak punya kolom baru | Mapping pakai fallback (`\|\| row['name']`, `\|\| row['date']`, dll.) — backward compatible |
| Validasi baru lebih ketat | Toleran: gunakan `assetDescription \|\| name` dan `assetCost \|\| originalVal` |
| Export file lebih besar (30+ kolom) | Wajar — lebih informasi, tidak ada issue performa |
| `assetId` duplikat saat reimport | Server error `23505` sudah ditangani di `catch` block `handleImport` |
| Field `assetCost` bertipe string (IDR) | Tidak diparse ke number saat import — sesuai schema DB (`text`) |

---

## Temuan Sinkronisasi DB ↔ Dashboard

### ✅ Yang Sudah Sinkron (Tidak Perlu Diubah)

Setelah tracing lengkap dari `ImportExcelModal` → `AssetContext` → `server.ts` → DB → Dashboard:

| Layer | Status | Keterangan |
|---|---|---|
| `schema.ts` — kolom DB | ✅ OK | Semua field extended sudah ada |
| `server.ts POST /api/assets/bulk` | ✅ OK | Menerima dan menyimpan semua field extended |
| `AssetContext.addAssetsBulk()` — payload mapping | ✅ OK | Sudah include `assetNumber`, `assetDescription`, `assetCost`, `datePlacedInService`, `listedStatus`, dll. |
| `AssetContext.fetchAssets()` setelah insert | ✅ OK | Dipanggil `await fetchAssets()` otomatis — state global langsung di-refresh |
| `Dashboard.tsx` — consume `useAsset()` | ✅ OK | Subscribe ke state global → langsung re-render tanpa reload |
| `Inventory.tsx` — consume `useAsset()` | ✅ OK | Subscribe ke state global → langsung re-render tanpa reload |

### ❌ Root Cause Gap (Yang Menyebabkan Data Kosong di Dashboard)

`ImportExcelModal.tsx` mem-push `validRows` ke `addAssetsBulk()` **tanpa menyertakan field extended**. Akibatnya field tersebut `undefined` → dikirim ke server sebagai kosong → disimpan `null` di DB → Dashboard tampil `-`.

```
ImportExcelModal (validRows.push)       AssetContext.addAssetsBulk()     DB (Cloud SQL)
────────────────────────────────        ─────────────────────────────    ─────────────
assetDescription: ❌ tidak di-push  →   assetDescription: undefined   →  NULL di DB
assetCost:        ❌ tidak di-push  →   assetCost: undefined          →  NULL di DB
datePlacedInService: ❌ tidak push  →   datePlacedInService: undefined →  NULL di DB
listedStatus:     ❌ tidak di-push  →   listedStatus: undefined       →  NULL di DB
assetNumber:      ❌ tidak di-push  →   assetNumber: undefined        →  NULL di DB
```

**Kesimpulan**: Perbaikan **hanya perlu dilakukan di layer frontend** (`ImportExcelModal.tsx` dan `Inventory.tsx`). Layer DB, server, dan context sudah benar.

---

## Tahapan Implementasi

> Dikerjakan secara berurutan. Setiap langkah harus selesai sebelum lanjut ke berikutnya.

### TAHAP 1 — Edit `src/components/ImportExcelModal.tsx`

Ini adalah file **utama** yang harus diperbaiki. Urutkan sub-langkahnya dari atas ke bawah file:

#### Langkah 1.1 — Update `ParsedRow` interface
- [x] Tambah field `assetNumber?: string`
- [x] Tambah field `assetDescription?: string`
- [x] Tambah field `assetCost?: string`
- [x] Tambah field `datePlacedInService?: string`
- [x] Tambah field `listedStatus?: string`

#### Langkah 1.2 — Update `mappedData` column mapping
- [x] Tambah mapping: `assetNumber` ← `row['Asset Number'] || row['id'] || AST-IMPORTED-${idx}`
- [x] Tambah mapping: `assetDescription` ← `row['Asset Description'] || row['Asset Description '] || row['Asset Name'] || row['name'] || ''`
- [x] Tambah mapping: `assetCost` ← `String(row['Asset Cost'] || row['Value'] || row['val'] || '')`
- [x] Tambah mapping: `datePlacedInService` ← `row['Date Placed in Service'] || row['Purchase Date'] || row['date'] || ''`
- [x] Tambah mapping: `listedStatus` ← `row['Listed Status'] || row['listedStatus'] || ''`

#### Langkah 1.3 — Update validasi di `handleImport`
- [x] Ganti `const nameStr = String(row.name || '')` → `const descStr = String(row.assetDescription || row.name || '')`
- [x] Ganti cek kosong dari `nameStr` → `descStr`
- [x] Ganti cek duplikat dari `nameStr` → `descStr`
- [x] Ganti variabel cost: pakai `row.assetCost || row.originalVal` untuk validasi harga
- [x] Update pesan error menjadi bahasa yang sesuai field baru

#### Langkah 1.4 — Update `validRows.push()` di `handleImport`
- [x] Tambah `assetNumber: row.assetNumber`
- [x] Tambah `assetDescription: row.assetDescription`
- [x] Tambah `assetCost: row.assetCost`
- [x] Tambah `datePlacedInService: row.datePlacedInService`
- [x] Tambah `listedStatus: row.listedStatus`

#### Langkah 1.5 — Update `handleExportErrors`
- [x] Ganti `'Asset Name': r.name` → `'Asset Number': r.assetNumber || r.id` dan `'Asset Description': r.assetDescription || r.name`
- [x] Ganti `'Purchase Date': r.date` → `'Date Placed in Service': r.datePlacedInService || r.date`
- [x] Ganti `'Value': r.originalVal` → `'Asset Cost': r.assetCost || r.originalVal`

#### Langkah 1.6 — Update Data Preview table
- [x] Ganti header: `Name` → `Asset Number`
- [x] Ganti header: `Subsidiary` → `Asset Description`
- [x] Ganti header: `Category` → `Category Seg. 1`
- [x] Ganti header: `Value` → `Asset Cost`
- [x] Update cell: `row.name` → `row.assetNumber || row.id || '-'`
- [x] Update cell: `row.subsidiary` → `row.assetDescription || row.name || '-'`
- [x] Update cell: `row.category` → `row.categorySegment1 || row.category || '-'`
- [x] Update cell: `row.originalVal` → `row.assetCost || row.originalVal || '-'`

#### Langkah 1.7 — Update hint text UI
- [x] Ganti teks petunjuk kolom dari format lama ke format baru yang menyebutkan kolom-kolom extended

---

### TAHAP 2 — Edit `src/pages/Inventory.tsx`

#### Langkah 2.1 — Update fungsi `handleExport`
- [x] Hapus semua kolom lama: `Asset ID`, `Name`, `Category`, `Purchase Date`, `Value (USD)`
- [x] Tambah semua kolom baru sesuai pemetaan `schema.ts` ↔ CSV (30+ kolom)
- [x] Pastikan setiap field pakai fallback: `asset.assetDescription || asset.name`, dll.
- [x] Kolom integer (`Asset Units`, `Life in Months`) pakai `?? ''` bukan `|| ''` agar nilai `0` tidak hilang

---

### TAHAP 3 — Verifikasi

Setelah implementasi selesai, lakukan pengecekan berikut:

#### Verifikasi Import
- [ ] Upload file CSV dengan kolom format baru → pastikan preview table menampilkan data yang benar
- [ ] Klik Import → pastikan tidak ada error
- [ ] Buka Inventory → pastikan asset baru muncul dengan `Asset Number`, `Asset Description`, `Asset Cost`, `Date Placed in Service` terisi (bukan `-`)
- [ ] Buka Dashboard → pastikan `Recent Asset Additions` menampilkan data dari import dengan kolom yang terisi

#### Verifikasi Export
- [ ] Klik Export di Inventory → buka file `.xlsx` hasil export
- [ ] Pastikan file punya 30+ kolom sesuai skema baru
- [ ] Pastikan file export bisa langsung dijadikan template untuk re-import

#### Verifikasi Backward Compatibility
- [ ] Upload file CSV format lama (hanya punya kolom `Asset Name`, `Value`, `Category`) → pastikan fallback mapping berfungsi dan tidak crash
- [ ] Pastikan validasi tidak reject data lama yang tidak punya `assetDescription` (harus fallback ke `name`)

---

### Ringkasan File yang Diubah

| File | Perubahan | Perlu Restart Server? |
|---|---|---|
| `src/components/ImportExcelModal.tsx` | `ParsedRow`, `mappedData`, validasi, `validRows.push`, `handleExportErrors`, preview, hint text | ❌ Tidak |
| `src/pages/Inventory.tsx` | `handleExport` — mapping kolom | ❌ Tidak |
| `server.ts` | **Tidak diubah** | — |
| `schema.ts` | **Tidak diubah** | — |
| `src/context/AssetContext.tsx` | **Tidak diubah** | — |
