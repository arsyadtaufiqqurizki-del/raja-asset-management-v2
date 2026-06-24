# Panduan Migrasi Sistem Manajemen Aset ke Lingkungan Perusahaan (Corporate Environment)

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan migrasi aplikasi Asset Inventory & Maintenance Management dari lingkungan pengembangan (AI Studio/Pribadi) ke infrastruktur resmi perusahaan.

## Arsitektur Saat Ini
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express API
- **Database**: PostgreSQL (dikelola via Drizzle ORM)
- **Authentication**: Firebase Authentication
- **AI Integration**: Xiaomi MiMo API

---

## Fase 1: Persiapan & Source Code
Langkah pertama adalah memindahkan kode sumber dari platform AI Studio ke sistem version control perusahaan.
1. Download atau Export kode sumber aplikasi dalam bentuk file `.zip`.
2. Buat repositori baru di Git provider perusahaan (misal: GitHub Enterprise, GitLab, atau Bitbucket).
3. Ekstrak file `.zip`, inisialisasi Git, dan dorong (push) kode ke repositori.
   ```bash
   git init
   git remote add origin <URL_REPO_PERUSAHAAN>
   git add .
   git commit -m "Initial commit from development environment"
   git push -u origin main
   ```

## Fase 2: Setup Database (PostgreSQL)
Aplikasi ini sangat bergantung pada PostgreSQL. Anda perlu memigrasikan skema dan data ke server database perusahaan.
1. **Provisioning:** Buat instans PostgreSQL baru di infrastruktur cloud perusahaan (misal: Google Cloud SQL, AWS RDS, atau on-premise PostgreSQL).
2. **Kredensial:** Dapatkan URI koneksi database (format: `postgresql://user:password@host:port/dbname`).
3. **Migrasi Skema:**
   Set environment variable `DATABASE_URL` ke database baru, kemudian jalankan migrasi Drizzle untuk membuat tabel:
   ```bash
   npm run db:generate
   npm run db:push
   ```
4. **Migrasi Data (Opsional):** Jika ada data dari sistem lama yang perlu dibawa, Anda dapat melakukan `pg_dump` dari database lama dan `pg_restore` ke database baru, ATAU menggunakan fitur **Export/Import Excel** yang sudah ditambahkan dalam aplikasi.

## Fase 3: Konfigurasi Firebase Authentication
Karena autentikasi menggunakan Firebase, Anda harus membuat Firebase Project baru di bawah akun Google Cloud organisasi/perusahaan.
1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat proyek baru.
2. Aktifkan **Authentication** (Pilih provider yang relevan, misalnya Email/Password, Google, atau Microsoft SSO jika perusahaan menggunakan Active Directory).
3. Daftarkan aplikasi Web di setting project Firebase.
4. Salin konfigurasi Firebase SDK dan perbarui file `.env` perusahaan Anda:
   ```env
   VITE_FIREBASE_API_KEY=your_corporate_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_corporate_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_corporate_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_corporate_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_corporate_sender_id
   VITE_FIREBASE_APP_ID=your_corporate_app_id
   ```

## Fase 4: Konfigurasi Environment Variables (Backend)
Siapkan file `.env` yang akan digunakan di server produksi (Backend Express).
```env
# Koneksi Database Eksternal
DATABASE_URL=postgresql://user:password@corporate-db-host:5432/asset_db

# Kunci API AI Assistant Xiaomi MiMo
MIMO_API_KEY=your_corporate_mimo_api_key

# Port Backend
PORT=3000
NODE_ENV=production
```

## Fase 5: Deployment (Build & Run)
Aplikasi ini adalah *Full-stack (Express + Vite)* di mana Express menyajikan API sekaligus file statis frontend React.

### Opsi A: Menggunakan Docker (Direkomendasikan)
Buat `Dockerfile` di root proyek jika akan di-deploy ke Kubernetes, Google Cloud Run, atau AWS ECS.
1. Build aplikasi:
   ```bash
   npm run build
   ```
   *Proses ini otomatis menjalankan `vite build` (frontend ke /dist) dan kompilasi `server.ts` menggunakan esbuild ke `dist/server.cjs`.*
2. Jalankan server:
   ```bash
   npm run start
   ```

### Opsi B: Traditional VM / VPS (Linux)
Jika menggunakan Virtual Machine (seperti EC2 atau Compute Engine):
1. Install Node.js v18+.
2. Clone repository: `git clone <repo>`
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Gunakan Process Manager seperti `pm2`:
   ```bash
   npm install -g pm2
   pm2 start dist/server.cjs --name "asset-management"
   ```

## Fase 6: Konfigurasi Domain & Keamanan (DNS, SSL)
1. Atur A-Record di DNS Management perusahaan (misal: `assets.nama-perusahaan.com`) untuk mengarah ke IP Server/Load Balancer.
2. Pasang SSL Certificate. Jika menggunakan Reverse Proxy seperti Nginx, konfigurasi Nginx untuk meneruskan trafik (Proxy Pass) ke port `3000` (port Node.js).
3. **CORS:** Sesuaikan konfigurasi CORS di `server.ts` (jika frontend dan backend dipisah domainnya). Karena aplikasi ini di-serve dari 1 instance (Express melayani dist React), settingan default sudah aman.

## Timelines & Checklist Go-Live
- [ ] **H-7:** Provisioning Server, Database, dan project Firebase corporate.
- [ ] **H-5:** UAT (User Acceptance Testing) di lingkungan staging perusahaan dengan Dummy Data.
- [ ] **H-3:** Migrasi Skema Database dan Uji coba Import Excel skala besar (10,000+ baris).
- [ ] **H-1:** Freeze sistem lama, export final data.
- [ ] **Hari-H:** Deploy kode ke server produksi, jalankan Import Final Data, point DNS `assets.perusahaan.com` ke server baru.

---
*Catatan: Pastikan untuk menjaga kerahasiaan file `.env` di lingkungan deployment dan tidak pernah melakukan commit file tersebut ke repositori Git.*
