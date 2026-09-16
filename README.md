# Buku — Catatan Keuangan

Web app pencatatan keuangan: kelompokkan pengeluaran per kategori, lihat chart donut per kategori dan tren 6 bulan terakhir. Dibangun pakai **React + Vite** dan **Firebase** (Auth + Firestore).

---

## 1. Setup Firebase (sekali saja)

1. Buka [console.firebase.google.com](https://console.firebase.google.com), klik **Add project**, ikuti langkahnya (boleh matikan Google Analytics, tidak wajib).
2. Setelah project dibuat, di sidebar kiri klik **Build > Authentication** → tab **Sign-in method** → aktifkan **Email/Password**.
3. Klik **Build > Firestore Database** → **Create database** → pilih mode **Start in test mode** (biar gampang dulu untuk development) → pilih lokasi server (misal `asia-southeast2` / Jakarta).
4. Kembali ke halaman utama project (ikon rumah) → klik ikon `</>` (Web) untuk **Add app** → kasih nama app (bebas) → **jangan** centang Firebase Hosting dulu → klik **Register app**.
5. Firebase akan menampilkan object `firebaseConfig` seperti ini:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "namaproject.firebaseapp.com",
     projectId: "namaproject",
     storageBucket: "namaproject.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
   };
   ```

   Salin masing-masing nilainya.

6. Di folder project ini, copy file `.env.example` jadi `.env`, lalu isi sesuai nilai di atas:

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=namaproject.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=namaproject
   VITE_FIREBASE_STORAGE_BUCKET=namaproject.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

### Firestore Security Rules (penting sebelum go-live)

Mode "test mode" di atas mengizinkan siapa saja baca/tulis data selama 30 hari — cukup untuk belajar, tapi **wajib diganti** sebelum aplikasi dipakai publik. Di Firestore Console → tab **Rules**, ganti jadi:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{id} {
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /goals/{id} {
      allow read, delete, update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /reminders/{id} {
      allow read, delete, update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /budgets/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Ini memastikan tiap user cuma bisa baca/tulis data miliknya sendiri, di keempat collection yang dipakai aplikasi ini (`transactions`, `goals`, `reminders`, `budgets`).

---

## 2. Jalankan di komputer

Pastikan sudah install [Node.js](https://nodejs.org) (versi 18 ke atas), lalu dari folder project:

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser. Daftar akun baru (email + password), lalu mulai catat transaksi.

---

## 3. Fitur

- **Dashboard** — saldo bulan ini, pemasukan/pengeluaran, chart kategori & tren 6 bulan
- **Anggaran** — atur budget per kategori pengeluaran, progress bar otomatis dari transaksi bulan berjalan
- **Laporan** — ringkasan mingguan / bulanan / tahunan, dengan navigasi maju-mundur antar periode
- **Target Keuangan** — bikin target nabung (mis. Dana Darurat), isi dana bertahap, progress ring persentase
- **Tagihan & Reminder** — catat tagihan berulang, tandai lunas, highlight otomatis kalau jatuh tempo ≤3 hari

## 4. Struktur project

```
src/
  firebase.js                 # koneksi ke Firebase
  context/AuthContext.jsx     # state login user
  pages/
    Login.jsx                 # halaman masuk/daftar
    Dashboard.jsx              # shell utama + routing antar halaman
    BudgetPage.jsx             # halaman Anggaran
    ReportsPage.jsx            # halaman Laporan
    GoalsPage.jsx               # halaman Target Keuangan
    RemindersPage.jsx           # halaman Tagihan & Reminder
    MorePage.jsx                 # menu Lainnya (profil, transaksi, logout)
  components/
    BottomNav.jsx               # navigasi bawah (5 tab)
    SummaryCards.jsx            # hero card saldo
    CategoryChart.jsx           # donut chart per kategori
    MonthlyChart.jsx            # bar chart tren
    GoalRing.jsx                 # ring progress target keuangan
    TransactionForm.jsx         # bottom sheet tambah transaksi
    GoalForm.jsx                 # bottom sheet tambah target
    ReminderForm.jsx             # bottom sheet tambah tagihan
    TransactionList.jsx          # daftar transaksi + filter kategori
  utils/
    categories.js                # daftar kategori pengeluaran/pemasukan
    firestore.js                  # CRUD transaksi
    budgets.js                    # CRUD budget per kategori
    goals.js                      # CRUD target keuangan
    reminders.js                  # CRUD tagihan
    aggregate.js                  # helper agregasi data & rentang periode laporan
    format.js                     # format Rupiah & tanggal
```

Kategori bisa kamu edit langsung di `src/utils/categories.js` — tinggal tambah/hapus/ubah warna item di array `EXPENSE_CATEGORIES` atau `INCOME_CATEGORIES`.

Warna & tema (dark premium) diatur terpusat di `src/index.css`, bagian `:root` — ganti nilai `--bg`, `--surface`, `--accent`, dll untuk ubah skema warna.

---

## 5. Deploy gratis

Setelah aplikasi siap, pilih salah satu:

**Opsi A — Vercel (paling gampang)**
```bash
npm install -g vercel
vercel
```
Ikuti instruksinya, lalu tambahkan environment variables (isi `.env` kamu) di dashboard Vercel → Project Settings → Environment Variables.

**Opsi B — Firebase Hosting** (nyambung langsung ke project Firebase yang sama)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # pilih "dist" sebagai public directory, jawab "y" untuk single-page app
npm run build
firebase deploy
```

---

## 6. Ide pengembangan lanjutan

- Tambah kategori custom yang bisa dibuat user sendiri (simpan di Firestore, bukan hardcode).
- Export data ke CSV/Excel.
- Notifikasi push (browser/PWA) untuk tagihan yang mendekati jatuh tempo.
- Multi-currency atau multi-akun (dompet, rekening, kartu kredit terpisah).
- Reminder berulang otomatis bikin entri baru tiap bulan (field `recurring` sudah tersedia di data, tinggal ditambah logikanya).
