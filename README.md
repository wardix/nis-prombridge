# NIS-PromBridge

**NIS-PromBridge** adalah layanan jembatan (*bridge service*) berkinerja tinggi yang menghubungkan **Sistem Informasi Internal** dengan ekosistem pemantauan Prometheus. Aplikasi ini berfungsi sebagai generator **Service Discovery (HTTP SD)** sekaligus **Custom Exporter** untuk memantau infrastruktur secara dinamis.

## 🚀 Fitur Utama

- **Dynamic Service Discovery**: Menyediakan endpoint `/sd/ticket-monitoring` untuk target pemantauan berdasarkan tiket gangguan aktif, serta `/sd/iforte-fttx`, `/sd/fbstar-fttx`, dan `/sd/cgs-fttx` untuk target pelanggan FTTx via mitra (Iforte/Fbstar/Cgs) yang tercatat di sistem informasi.
- **Domain Expiry Monitoring**: Mengekspos metrik tanggal kedaluwarsa domain pelanggan langsung ke Prometheus.
- **High Performance**: Dibangun di atas runtime **Bun** dan framework **Hono** untuk memastikan latensi minimal dan efisiensi sumber daya.
- **Native SQL**: Menggunakan `bun:sql` (driver native Zig) untuk koneksi database MySQL yang aman, cepat, dan modern.
- **Professional Tooling**: Menggunakan **Biome** untuk standarisasi kode dan **Husky** untuk validasi otomatis sebelum commit.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) (All-in-one JavaScript runtime)
- **Web Framework**: [Hono](https://hono.dev/) (Ultrafast web framework)
- **Database**: Native MySQL via `bun:sql`
- **Metrics**: `prom-client` (Standard Prometheus client for Node.js/Bun)
- **Validation**: `Zod` (TypeScript-first schema validation)
- **Formatting**: `Biome` (Fast all-in-one toolchain)

## 📋 Endpoint API

### 1. Service Discovery
| Endpoint | Method | Deskripsi |
| :--- | :--- | :--- |
| `/sd/ticket-monitoring` | `GET` | Mengembalikan daftar target IP pelanggan dengan tiket berstatus 'Open'. Mendukung filter cabang melalui query parameter `?branch=020,027`. |
| `/sd/iforte-fttx` | `GET` | Mengembalikan daftar target IP pelanggan FTTx aktif melalui jaringan mitra Iforte. Mendukung filter cabang melalui query parameter `?branch=020,028`. |
| `/sd/fbstar-fttx` | `GET` | Mengembalikan daftar target IP pelanggan FTTx aktif melalui jaringan mitra Fbstar. Mendukung filter cabang melalui query parameter `?branch=020,028`. |
| `/sd/cgs-fttx` | `GET` | Mengembalikan daftar target IP pelanggan FTTx aktif melalui jaringan mitra Cgs. Mendukung filter cabang melalui query parameter `?branch=020,028`. |

### 2. Metrics (Format Prometheus)
| Endpoint | Method | Deskripsi |
| :--- | :--- | :--- |
| `/metrics/domains` | `GET` | Mengekspos metrik `domain_expiry_timestamp` (Unix timestamp) dengan label pendukung seperti `domain`, `expiry` (YYYY-MM-DD), dan `csid`. |

## ⚙️ Instalasi & Setup

1. **Instalasi Dependensi**:
   ```bash
   bun install
   ```

2. **Konfigurasi Lingkungan**:
   Salin berkas `.env.example` menjadi `.env` dan sesuaikan kredensial database Anda:
   ```bash
   cp .env.example .env
   ```

3. **Menjalankan Aplikasi**:
   ```bash
   # Mode Produksi
   bun start

   # Mode Pengembangan (Auto-reload)
   bun dev
   ```

## 🧹 Standar Pengembangan

Proyek ini mewajibkan penggunaan **Biome** untuk menjaga kerapian kode. Proses pemformatan otomatis akan dijalankan setiap kali Anda melakukan commit menggunakan Git Hooks (Husky).

Untuk menjalankan pemformatan secara manual:
```bash
bun format
```

---
*Dikembangkan dengan presisi oleh tim NIS-PromBridge.*
