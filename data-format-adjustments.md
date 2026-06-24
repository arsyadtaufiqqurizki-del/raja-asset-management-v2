# Rencana Implementasi (5 Fase) - Format Data Aset

- [x] **Fase 1: Pembaruan Skema Database (Database Schema Update)**
  - Target: `src/db/schema.ts` dan eksekusi migrasi ke Cloud SQL.
  - Tindakan: Menambahkan kolom-kolom baru ke tabel assets di database Drizzle ORM.
    - `asset_units` (integer, default 1)
    - `depreciation_method` (varchar)
    - `life_in_months` (integer)
    - `listed_status` (varchar, misal: 'Audited', 'Non-Listed')
  - Catatan: Memastikan format kolom seperti `asset_book`, `category_segment_1`, dan `category_segment_2`.

- [x] **Fase 2: Penyesuaian API Backend (Express Server)**
  - Target: `server.ts`
  - Tindakan: Memodifikasi endpoint POST `/api/assets` (Create) dan PUT `/api/assets/:id` (Update).
  - Detail: Memastikan backend menerima field baru dari frontend dan memetakannya saat INSERT/UPDATE ke database PostgreSQL.

- [x] **Fase 3: Pembaruan Tipe Data & Context (Frontend State)**
  - Target: `src/context/AssetContext.tsx`
  - Tindakan: Mengubah interface `Asset` di TypeScript agar mengenali properti baru (`assetUnits`, `depreciationMethod`, `lifeInMonths`, `listedStatus`).
  - Detail: Memastikan saat data di-fetch dari backend, data di-mapping dengan benar ke state global React.

- [x] **Fase 4: Desain Ulang Form Tambah Aset (AddAssetModal)**
  - Target: `src/components/AddAssetModal.tsx`
  - Tindakan: Merombak total UI form input menjadi struktur multi-section:
    - Bagian 1: Identitas Aset (Asset Number, Asset Description, Asset Book, Asset Units)
    - Bagian 2: Nilai & Akuisisi (Asset Cost, Date Placed in Service)
    - Bagian 3: Kategorisasi (Category Segment 1, Category Segment 2 / Location)
    - Bagian 4: Akuntansi / Penyusutan (Depreciation Method, Life in Months)
    - Bagian 5: Status (Listed, Status)
  - Detail: Menyambungkan input field ke state lokal form siap dikirim ke API.

- [x] **Fase 5: Penyesuaian Tabel Dasbor & Inventaris**
  - Target: `src/pages/Dashboard.tsx` (dan menyesuaikan Inventory.tsx jika diperlukan).
  - Tindakan: Mengubah struktur header `<th>` dan baris data `<td>` di tabel "Recent Asset Additions".
  - Detail: Menampilkan persis 11 kolom:
    1. Asset Book
    2. Asset Number
    3. Asset Description
    4. Asset Cost (Valuation)
    5. Date Placed in Services
    6. Asset Units
    7. Asset Category Segment 2 (Location)
    8. Depreciation Method
    9. Life in Months
    10. Listed
    11. Status
