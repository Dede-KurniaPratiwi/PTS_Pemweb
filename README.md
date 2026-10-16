# InfoProduk Bunyu

**Nama:** Dede Kurnia Pratiwi
**NPM:** 2440304028  
**Video Demo:** [link video]

## 1. Deskripsi Aplikasi
Dashboard katalog produk dan UMKM lokal Pulau Bunyu. Pengguna dapat mencari produk, melihat statistik harga, dan menyimpan produk favorit langsung di browser. Data berasal dari DummyJSON dengan konversi mata uang tetap Rp16.000/USD serta disaring ke kategori yang relevan untuk warga.

## 2. Varian NIM (Akhir 028)
* **X = 0, Y = 2, Z = 8** ($S = 10, C = 10 \text{ mod } 4 = 2$)
* **Dataset:** Products (DummyJSON)
* **Fitur Utama ($Y=2$):** Bookmark/Favorit menggunakan `localStorage`
* **Validasi Form ($Z=8$):** Minimal satu kategori minat wajib dipilih
* **Challenge ($C=2$):** Loading indicator + pencarian menggunakan *debounce*

## 3. Endpoint REST API
* `https://dummyjson.com/products?limit=0`
* `https://dummyjson.com/products/search?q=KATA&limit=0`

## 4. Cara Menjalankan
1. Salin folder project ke direktori web server (cth: `C:\laragon\www\PTS_Pemweb`).
2. Nyalakan Laragon dan buka browser di `http://localhost/PTS_Pemweb`. 
3. Pastikan perangkat terhubung ke internet.

## 5. Jawaban Pertanyaan Penjelasan Kode
1. **Alur:** `loadProducts()` memanggil `fetch()`, memeriksa `response.ok` dan `response.json()`, menyaring kategori, lalu merender DOM (`renderProducts` & `renderStats`) serta mengelola state loading di blok `finally`.
2. **`response.ok`:** `fetch()` hanya gagal saat jaringan putus. Respons HTTP 404/500 tetap masuk jalur sukses, sehingga pengecekan `response.ok` wajib dilakukan manual untuk mencegah error data `undefined`.
3. **JSON ke DOM:** Fungsi `createCard()` memetakan objek produk menjadi elemen HTML (`<article>`, `<img>`, `<h3>`, `<p>`) yang dimasukkan ke grid utama menggunakan `append()`.
4. **Penanganan Error:** Gangguan jaringan atau HTTP error memicu blok `catch`, menjalankan `showError()` untuk menampilkan pesan kendala dan tombol "Coba Lagi".
5. **Fitur Favorit:** Klik tombol memicu `toggleFav()`, membaca data dari `localStorage`, menambah/menghapus item, lalu memperbarui penyimpanan dan tampilan antarmuka secara reaktif.
6. **Validasi Form:** Form memakai `novalidate`. Saat submit, fungsi `cekNama()`, `cekEmail()`, dan `cekKategori()` memeriksa isian. Input tidak valid dicegah agar data konsisten dan pengguna tahu bagian yang harus diperbaiki.
7. **localStorage:** Menyimpan array produk favorit dengan kunci `favoriteProducts`. Data dibaca saat halaman dimuat dan diubah saat tombol favorit diklik agar tetap bertahan (*persistent*) saat halaman disegarkan.
8. **Fungsi Debounce:**
   ```js
   const debounce = (fn, delay = 500) => {
       let timer;
       return (...args) => {
           clearTimeout(timer);
           timer = setTimeout(() => fn(...args), delay);
       };
   };