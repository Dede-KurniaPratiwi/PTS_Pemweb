# InfoProduk Bunyu

**Nama:** Dede Kurnia Pratiwi
**NPM:** 2440304028
**Kelas:** Teknik Komputer
**Repository:** [link GitHub]
**Video Demo:** [link video]

## 1. Deskripsi Aplikasi
InfoProduk Bunyu adalah aplikasi web katalog produk dan UMKM lokal Pulau Bunyu yang mengambil data dinamis dari DummyJSON API dan menyaring kategori yang relevan untuk warga. Aplikasi ini dilengkapi fitur pencarian instan dengan debounce, kalkulasi statistik harga dan kategori otomatis, penyimpanan produk favorit menggunakan localStorage, serta formulir usulan interaktif berbasis modal dengan validasi minimal satu kategori pilihan.

## 2. Perhitungan Varian NPM (berakhir 028)
X=0, Y=2, Z=8. S = 0+2+8 = 10, C = 10 mod 4 = 2.

| Komponen | Hasil |
|---|---|
| Dataset (X=0) | Products |
| Fitur utama (Y=2) | Favorit/Bookmark dengan localStorage |
| Validasi (Z=8) | Minimal satu kategori/preferensi dipilih |
| Challenge (C=2) | Loading indicator + pencarian dengan debounce |

## 3. Dataset dan Endpoint REST API
Dataset: Products (DummyJSON).
- `https://dummyjson.com/products?limit=0`
- `https://dummyjson.com/products/search?q=KATA&limit=0`

## 4. Fitur Utama dan Challenge
- Daftar produk dari REST API dalam grid responsif (4/2/1 kolom).
- Pencarian dengan debounce 500 ms dan indikator loading (challenge C=2).
- Statistik dihitung JavaScript dari produk yang tampil: rata-rata harga, produk termahal, jumlah kategori.
- Favorit dengan localStorage (Y=2), tombol memakai `aria-pressed`.
- Form "Kotak Usul & Saran Produk": nama wajib, email opsional (jika diisi harus valid), minimal satu kategori (Z=8). Error berupa teks dengan ikon ⚠, sukses menampilkan ringkasan.
- State loading, error (dengan tombol Coba Lagi), dan kosong.

## 5. Cara Menjalankan
1. Salin folder project ke `C:\laragon\www\PTS_Pemweb`.
2. Jalankan Laragon (Start All), lalu buka `http://localhost/PTS_Pemweb`.
3. Pastikan terhubung ke internet.

## 6. Jawaban Pertanyaan Penjelasan Kode

1. **Alur:** Saat halaman dibuka, `app.js` memanggil `renderFavorites()` dan `loadProducts()`. `loadProducts()` menjalankan `showLoading()`, membuat URL lewat `buildUrl()`, memanggil `fetch()`, memeriksa `response.ok`, lalu `response.json()`. Data disaring dengan `filter()`, lalu `renderProducts()` dan `renderStats()` menampilkan hasilnya. `hideLoading()` di blok `finally` menyembunyikan loading.
2. **`response.ok`:** `fetch()` hanya gagal saat jaringan putus. Respons HTTP 404/500 tetap dianggap berhasil. Di aplikasiku, jika endpoint salah dan server membalas 404, `data.products` menjadi `undefined` sehingga `filter()` error. Karena itu `response.ok` dicek lalu `throw new Error` agar ditangani `showError()`.
3. **JSON ke DOM:** Contoh produk "Essence Mascara Lash Princess" (price 9.99). `createCard()` membuat `<article>` dengan `createElement`, `<img>` dari `thumbnail`, `<h3>` dari `title`, dan `<p>` harga dari `formatHarga(product.price)`. Semuanya digabung dengan `append()`, lalu `renderProducts()` memasukkannya ke `#grid-produk` sehingga tampil di layar.
4. **Penanganan error:** Internet terputus membuat `fetch()` melempar error. Endpoint salah atau HTTP 404/500 membuat `response.ok` false lalu `throw new Error`. Keduanya masuk `catch`, `showError()` menampilkan pesan dan tombol "Coba Lagi" yang memanggil `loadProducts()` lagi. Loading disembunyikan di `finally`.
5. **Fitur favorit (Y=2):** Klik tombol memicu event `click` yang memanggil `toggleFav()`. Fungsi ini membaca `getFavs()`, memakai `isFav()` untuk mengecek, menghapus dengan `filter()` atau menambah dengan spread, lalu menyimpan lewat `saveFavs()`. Setelah itu `renderFavorites()` dan `syncFavButtons()` memperbarui tampilan, teks tombol, dan `aria-pressed`. Tombol Favorit di header menampilkan atau menyembunyikan bagian favorit.
6. **Validasi (Z=8):** Form memakai `novalidate`, jadi validasi dilakukan JavaScript. Saat submit, `preventDefault()` menahan pengiriman, lalu `cekNama()`, `cekEmail()`, dan `cekKategori()` memeriksa isian. `cekKategori()` memakai selector `input[name="kategori"]:checked` dan memeriksa `length === 0`. Input tidak valid tidak boleh diproses karena bisa membuat data kosong atau salah format masuk ke sistem, dan pengguna perlu tahu apa yang harus diperbaiki.
7. **localStorage:** Menyimpan array produk favorit (id, title, category, price, thumbnail) dengan kunci `favoriteProducts`, dalam bentuk string JSON. Dibaca saat halaman dimuat dan saat kartu dibuat, diubah saat tombol favorit diklik. Alasannya agar favorit tidak hilang saat halaman ditutup atau di-refresh.
8. **Fungsi `debounce`:**
```js
   function debounce(fn, delay = 500) {
     let timer;
     return (...args) => {
       clearTimeout(timer);
       timer = setTimeout(() => fn(...args), delay);
     };
   }
```
   Input: fungsi `fn` dan jeda `delay`. Proses: setiap dipanggil, timer lama dibatalkan dengan `clearTimeout`, lalu timer baru dibuat. Output: fungsi yang baru menjalankan `fn` setelah pengguna berhenti mengetik, jadi request ke API tidak dikirim di setiap huruf.

9. **Bug tersulit:** Bug tersulit yang saya alami adalah ketika judul atau teks status pada elemen halaman tidak mau berubah secara dinamis saat pencarian dilakukan, yang disebabkan oleh selektor DOM yang mengambil elemen sebelum proses render selesai atau fungsi pembaruan teks yang belum dipanggil, lalu ditemukan melalui tab Console pada Developer Tools saat mengecek elemen bernilai null, dan diperbaiki dengan memastikan pemanggilan fungsi pembaruan DOM diletakkan tepat setelah data JSON berhasil diproses serta menggunakan ID atau class elemen yang benar di file app.js.
10. **Dua perbaikan jika ada waktu seminggu:** Jika diberi waktu satu minggu lagi, dua perbaikan teknis yang akan saya lakukan adalah merancang modul pendaftaran UMKM mandiri yang mengarahkan pembeli langsung ke tautan profil atau Facebook Marketplace milik penjual lokal Pulau Bunyu (sebagai solusi praktis tanpa perlu menarik API Facebook yang dibatasi), serta menambahkan fitur pagination dan filter kategori spesifik agar katalog produk dalam jumlah besar lebih cepat, rapi, dan mudah ditelusuri oleh pengguna.

## 7. AI Usage Log

| Tanggal | AI/Tool | Tujuan | Prompt/Ringkasan | Bagian Digunakan | Verifikasi/Modifikasi |
|---|---|---|---|---|---|
| Oktober 2026 | Gemini & Claude | Konsultasi struktur logika JavaScript, referensi sintaks Fetch API, dan *debugging* error | Meminta referensi penulisan struktur `async/await`, penanganan `try...catch`, serta solusi penanganan error DOM selector | Bantuan referensi sintaks di app.js dan style.css | Seluruh perancangan logika, integrasi data DummyJSON, implementasi fitur NIM, serta pengujian langsung pada Browser (menggunakan DevTools Console & Network tab) dikerjakan secara mandiri. |