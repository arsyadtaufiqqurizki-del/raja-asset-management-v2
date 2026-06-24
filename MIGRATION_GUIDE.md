# Panduan Migrasi / Handover ke Tim IT

Dokumen ini berisi panduan teknis untuk tim IT mengenai arsitektur, konfigurasi, dan langkah-langkah deployment aplikasi Asset Inventory & Maintenance Management.

## 1. Arsitektur & Tech Stack

Aplikasi ini dibangun menggunakan arsitektur Full-Stack berbasis JavaScript/TypeScript:

*   **Frontend:** React 18 (dengan Vite), TypeScript, dan Tailwind CSS.
*   **Backend:** Express.js (dijalankan via Node.js, dikompilasi menggunakan `esbuild` ke `dist/server.cjs`).
*   **Database:** PostgreSQL (Cloud SQL) dengan Drizzle ORM.
*   **Autentikasi:** Firebase Authentication.
*   **Integrasi AI:** Xiaomi MiMo API (Chat Assistant).

Aplikasi beroperasi dalam satu container di mana Express.js bertindak sebagai API server (`/api/*`) sekaligus menyajikan file statis frontend (SPA) saat dijalankan di mode *production*.

## 2. Persyaratan Lingkungan (Prerequisites)

Tim IT perlu menyiapkan layanan berikut sebelum mendeploy aplikasi:

1.  **Node.js:** Versi 18 atau 20.
2.  **PostgreSQL Database:** Bisa menggunakan Google Cloud SQL, AWS RDS, Supabase, atau PostgreSQL mandiri.
3.  **Firebase Project:** Buat project di Firebase Console dan aktifkan "Email/Password Authentication" (atau provider login lainnya yang diinginkan).
4.  **Xiaomi MiMo API Key:** Untuk integrasi asisten AI di dalam aplikasi.

## 3. Konfigurasi Environment Variables

Buat file `.env` di root project berdasarkan `.env.example`. Berikut adalah variabel yang harus diisi:

```env
# Konfigurasi Firebase (Dapatkan dari Project Settings > General > Your Apps di Firebase Console)
# Variabel dengan prefix VITE_ akan diekspos ke frontend
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Konfigurasi Database PostgreSQL
# Contoh: postgresql://username:password@host:port/dbname
DATABASE_URL="your-postgresql-database-url"

# Konfigurasi AI
MIMO_API_KEY="your-mimo-api-key"
```

## 4. Langkah-Langkah Migrasi Database

Aplikasi menggunakan Drizzle ORM untuk manajemen skema database. Tim IT perlu melakukan migrasi skema ke database PostgreSQL yang baru disiapkan.

1.  Pastikan `DATABASE_URL` sudah terisi di file `.env`.
2.  Generate file migrasi SQL:
    ```bash
    npm run generate
    ```
3.  Terapkan skema ke database:
    ```bash
    npm run migrate
    ```

*Catatan: File definisi skema tabel terdapat di `src/db/schema.ts`.*

## 5. Menjalankan Aplikasi Secara Lokal (Development)

Untuk mengembangkan atau menguji aplikasi di lokal:

1.  Install dependensi:
    ```bash
    npm install
    ```
2.  Jalankan server development:
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:3000`. Di mode *dev*, `server.ts` akan membungkus Vite Middleware sehingga frontend dan backend API berjalan di port yang sama.

## 6. Build & Deployment (Production)

Untuk melakukan deployment ke production (misalnya ke Google Cloud Run, AWS App Runner, Docker, atau VPS biasa):

1.  Jalankan perintah build:
    ```bash
    npm run build
    ```
    *   Proses ini akan menjalankan `vite build` untuk mencetak file statis React ke dalam folder `dist/`.
    *   Lalu menjalankan `esbuild` untuk mengompilasi backend Express (`server.ts`) menjadi file tunggal `dist/server.cjs`.

2.  Jalankan server production:
    ```bash
    npm start
    ```
    *   Perintah ini akan menjalankan `node dist/server.cjs`.
    *   Express akan melayani endpoint `/api/*` dan juga menyajikan file statis React dari folder `dist/`.

### Deployment menggunakan Docker (Opsional)
Jika tim IT menggunakan Docker, buat `Dockerfile` sederhana dengan instruksi berikut:
1. Base image `node:20-alpine`.
2. Copy `package*.json`, jalankan `npm ci`.
3. Copy source code.
4. Set environment variables.
5. Jalankan `npm run build`.
6. Expose port `3000` dan jalankan `npm start`.

## 7. Autentikasi Frontend ke Backend
Saat user login via Firebase di frontend, frontend akan mendapatkan **ID Token**. Token ini dikirimkan via header `Authorization: Bearer <token>` pada setiap *request* ke backend Express (`/api/*`).
Backend (Express) akan memverifikasi token ini untuk memastikan *request* tersebut sah dan mendapatkan UID pengguna.

## 8. Export Kode
Untuk menyerahkan kode ini, Anda dapat:
*   Buka menu **Settings** (ikon gir) di AI Studio.
*   Pilih **Export as ZIP** atau **Export to GitHub**.
*   Serahkan file ZIP atau repository tersebut beserta file `MIGRATION_GUIDE.md` ini kepada tim IT.
