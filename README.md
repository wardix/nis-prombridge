# NIS-PromBridge

**NIS-PromBridge** adalah layanan jembatan (*bridge service*) berkinerja tinggi yang menghubungkan **Sistem Informasi Internal** dengan ekosistem pemantauan Prometheus. Aplikasi ini berfungsi sebagai generator **Service Discovery (HTTP SD)** sekaligus **Custom Exporter** untuk memantau infrastruktur secara dinamis.

## 🚀 Fitur Utama

- **Dynamic Service Discovery**: Menyediakan endpoint untuk target pemantauan otomatis berdasarkan tiket aktif dan data pelanggan FTTx dari berbagai mitra (Iforte, Fbstar, Cgs, Sip).
- **SLA & Compliance Monitoring**: Mengekspos metrik waktu eskalasi tiket vendor untuk memantau kepatuhan deadline/SLA.
- **Data Quality Audit**: Memonitor kelengkapan data administratif seperti Vendor Circuit ID yang belum terisi.
- **Domain Expiry Monitoring**: Melacak tanggal kedaluwarsa domain pelanggan lengkap dengan informasi layanan yang terdampak.
- **Native Performance**: Dibangun dengan **Bun** dan **Hono** menggunakan native `bun:sql` untuk kecepatan maksimal.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Web Framework**: [Hono](https://hono.dev/)
- **Database**: Native MySQL via `bun:sql`
- **Metrics**: `prom-client`
- **Formatting**: `Biome`

## 📋 Endpoint API

### 1. Service Discovery (JSON Format)
Seluruh endpoint SD menghasilkan format target Prometheus dengan label standar: `ip`, `subscriber_id`, `subscriber_name`, dan penanda kategori (`ticketing="yes"` atau `fttx="yes"`).

| Endpoint | Method | Deskripsi |
| :--- | :--- | :--- |
| `/sd/ticket-monitoring` | `GET` | Target IP pelanggan dengan tiket berstatus 'Open'. |
| `/sd/iforte-fttx` | `GET` | Target IP pelanggan FTTx via mitra Iforte. |
| `/sd/fbstar-fttx` | `GET` | Target IP pelanggan FTTx via mitra Fbstar. |
| `/sd/cgs-fttx` | `GET` | Target IP pelanggan FTTx via mitra Cgs. |
| `/sd/sip-fttx` | `GET` | Target IP pelanggan FTTx via mitra Sip. |

*Semua endpoint SD mendukung filter cabang melalui query parameter `?branch=020,027`.*

### 2. Metrics (Prometheus Text Format)
| Endpoint | Method | Deskripsi |
| :--- | :--- | :--- |
| `/metrics/domains` | `GET` | Metrik `domain_expiry_timestamp` untuk melacak kedaluwarsa domain. |
| `/metrics/operator-tickets` | `GET` | Metrik `operator_ticket_created_timestamp_seconds` untuk monitoring SLA vendor. |
| `/metrics/data-quality` | `GET` | Metrik `data_quality_missing_circuit_id` untuk audit kelengkapan data Vendor CID. |
| `/metrics/tickets` | `GET` | Metrik `ticket_unassigned_info` untuk tiket yang belum ditugaskan ke petugas. |

---

## ⚙️ Instalasi & Setup

1. **Instalasi Dependensi**:
   ```bash
   bun install
   ```

2. **Konfigurasi Lingkungan**:
   Salin berkas `.env.example` menjadi `.env` dan sesuaikan kredensial database Anda. Tambahkan juga konfigurasi mapping tipe tiket jika diperlukan:
   - `TICKET_TYPE_1_NAME=incident`
   - `TICKET_TYPE_2_NAME=request`

3. **Menjalankan Aplikasi**:
   ```bash
   # Mode Produksi
   bun start

   # Mode Pengembangan (Auto-reload)
   bun dev
   ```

## 🧹 Standar Pengembangan

Proyek ini mewajibkan penggunaan **Biome** untuk menjaga kerapian kode. Proses pemformatan otomatis akan dijalankan setiap kali Anda melakukan commit menggunakan Git Hooks (Husky).

---
*Dikembangkan dengan presisi oleh tim NIS-PromBridge.*
