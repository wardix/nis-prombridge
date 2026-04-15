# NIS-PromBridge: Gemini CLI Mandates

Dokumen ini berisi instruksi mendasar bagi **Gemini CLI** untuk mengelola dan mengembangkan proyek **NIS-PromBridge**.

## 🏗️ Arsitektur & Prinsip Teknologi
- **Runtime**: Wajib menggunakan Bun (v1.x).
- **Framework**: Hono untuk routing dan middleware.
- **Database**: Harus menggunakan `bun:sql`. Dilarang keras menggunakan query string mentah; wajib menggunakan *tagged template literals* (misal: `sql`SELECT...``) untuk mencegah SQL Injection.
- **Metrik**: Menggunakan `prom-client` dengan pemisahan *registry* jika diperlukan untuk frekuensi *scraping* yang berbeda.
- **Gaya Kode**: Mengikuti standar Biome (Spasi sebagai indentasi, single quote, dan semicolon minimal).

## 📁 Panduan Struktur Direktori
- `src/index.ts`: Inisialisasi aplikasi Hono dan Bun server.
- `src/db/client.ts`: Abstraksi koneksi database utama.
- `src/services/`: Berisi logika pengambilan data (SQL queries) untuk SD dan Metrik.
- `src/routes/`: Definisi endpoint HTTP.
- `src/config.ts`: Validasi variabel lingkungan menggunakan Zod.

## 📜 Instruksi Pengembangan (Mandatory)

### 1. Penambahan Service Discovery (SD)
- Logika query wajib ditempatkan di `src/services/sd.service.ts`.
- Fungsi harus mengembalikan tipe data `PrometheusTarget[]`.
- Pastikan endpoint didaftarkan pada `src/routes/sd.routes.ts`.

### 2. Penambahan Metrik Baru
- Definisikan atau gunakan *registry* yang sesuai di `src/services/metrics.service.ts`.
- Gunakan tipe metrik `Gauge` untuk nilai yang bersifat fluktuatif (seperti timestamp atau hitungan jumlah).
- Pastikan metrik diupdate di service sebelum diekspos melalui `src/routes/metrics.routes.ts`.

### 3. Integritas Database
- Selalu gunakan `sql` yang diekspor dari `src/db/client.ts`.
- Query harus efisien dan menggunakan filter yang tepat dari sistem informasi internal.

### 4. Otomatisasi & Format
- Jalankan perintah `bun format` setiap kali selesai melakukan modifikasi kode.
- Jangan menambahkan dependensi formatter lain (seperti Prettier atau ESLint).

## 🧪 Validasi Perubahan
Setiap penambahan atau modifikasi endpoint wajib diverifikasi menggunakan `curl` untuk memastikan format JSON (untuk SD) atau format teks (untuk Metrik) sudah sesuai dengan standar Prometheus.
