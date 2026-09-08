# Personal AI Companion: GitHub Streak, Keuangan & Ruang Curhat

Aplikasi mandiri (*standalone web application*) modern yang dirancang khusus untuk menemani keseharian developer dengan 3 pilar fitur:
1. **GitHub Streak Reminder & Monitor**: Melacak streak commit harian, histori commit terbaru, serta menyediakan endpoint webhook instan.
2. **Laporan & Pencatatan Keuangan Pintar**: Catat pengeluaran/pemasukan dengan kalimat bebas sehari-hari ditenagai AI (*Smart Parsing*), visualisasi alokasi pengeluaran per kategori, dan pemantauan arus kas.
3. **Ruang Curhat Empatis**: Teman bicara yang hangat dan suportif ditenagai OpenAI GPT-4o / GPT-4o-mini untuk mendengarkan kejenuhan koding (burnout), keluh kesah harian, maupun merayakan pencapaian.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menggunakan Script 1-Klik (Windows)
Cukup jalankan file `run_app.bat`:
```cmd
run_app.bat
```
Browser akan otomatis terbuka di `http://localhost:5173`.

### Opsi 2: Menjalankan Secara Manual

**1. Jalankan Backend (FastAPI):**
```bash
cd backend
python -m uvicorn app.main:app --port 8000 --reload
```

**2. Jalankan Frontend (React + Vite):**
```bash
cd frontend
npm run dev
```
Buka browser di `http://localhost:5173`.

---

## ⚙️ Pengaturan & Konfigurasi

Klik ikon **Pengaturan (Gerigi)** di pojok kanan atas aplikasi:
- **OpenAI API Key**: Masukkan API key OpenAI (`sk-...`) agar fitur Ruang Curhat dan ekstraksi pintar pengeluaran aktif.
- **GitHub Username**: Masukkan username GitHub publik kamu untuk langsung menghitung streak dan commit hari ini.
- **Webhook URL**: Pasang URL webhook `http://localhost:8000/api/github/webhook` pada repository GitHub kamu agar setiap `git push` langsung terdeteksi seketika!

---

## 📁 Struktur Proyek
- `backend/`: FastAPI dengan arsitektur modular, SQLite persistence, dan OpenAI SDK.
- `frontend/`: React 19 + Vite + Lucide Icons + custom responsive theme.
