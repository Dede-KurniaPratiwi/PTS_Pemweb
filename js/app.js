/* ===== 1. KONFIGURASI ===== */
const API_BASE = "https://dummyjson.com/products";
const LIMIT = 0;          // 0 = ambil semua produk dari DummyJSON
const KURS = 16000;       // kurs tetap contoh (USD ke Rupiah), bukan kurs real-time
const JUMLAH_PROMO = 4;   // jumlah produk di section promo & rekomendasi
const TIMEOUT_MS = 15000; // batas tunggu server (jaringan HP bisa lambat)

// Hanya kategori yang relevan untuk konteks warga/UMKM Bunyu
const KATEGORI_TAMPIL = [
  "groceries", "kitchen-accessories", "home-decoration", "furniture",
  "beauty", "fragrances", "skin-care", "womens-dresses",
  "womens-bags", "mens-shirts"
];

let currentProducts = [];
let requestCounter = 0;

const el = {
  grid: document.getElementById("grid-produk"),
  loadingState: document.getElementById("loading-state"),
  loadingCari: document.getElementById("loading-cari"),
  errorState: document.getElementById("error-state"),
  errorTeks: document.getElementById("error-teks"),
  emptyState: document.getElementById("empty-state"),
  btnRetry: document.getElementById("btn-retry"),
  inputCari: document.getElementById("input-cari"),
  statRata: document.getElementById("stat-rata"),
  statTermahal: document.getElementById("stat-termahal"),
  statTermahalNama: document.getElementById("stat-termahal-nama"),
  statKategori: document.getElementById("stat-kategori"),
  secPromo: document.getElementById("promo"),
  secRekom: document.getElementById("rekomendasi"),
  gridPromo: document.getElementById("grid-promo"),
  gridRekom: document.getElementById("grid-rekomendasi"),
  gridFav: document.getElementById("grid-favorit"),
  favKosong: document.getElementById("fav-kosong"),
  favSection: document.getElementById("favorit"),
  jumlahFav: document.getElementById("jumlah-fav"),
  btnFavorit: document.getElementById("btn-favorit"),
};

/* ===== 2. FORMAT ===== */
function formatHarga(usd) {
  try {
    return usd.toLocaleString("en-US", { style: "currency", currency: "USD" });
  } catch (e) {
    // cadangan untuk browser lama
    return "$" + usd.toFixed(2);
  }
}

// "kitchen-accessories" -> "Kitchen Accessories"
function formatKategori(kategori) {
  return kategori
    .split("-")
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(" ");
}

// kosongkan grid lalu isi dengan kartu (kompatibel dengan browser lama)
function isiGrid(gridEl, cards) {
  gridEl.innerHTML = "";
  cards.forEach((card) => gridEl.appendChild(card));
}

/* ===== 3. FETCH DATA ===== */
function buildUrl(query) {
  return query
    ? `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${LIMIT}`
    : `${API_BASE}?limit=${LIMIT}`;
}

// fetch dengan batas waktu: dibatalkan jika server terlalu lama menjawab
async function fetchWithTimeout(url) {
  if (typeof AbortController === "undefined") return fetch(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ubah error teknis jadi kalimat yang mudah dipahami
function pesanError(error) {
  if (error.name === "AbortError") return "Server terlalu lama merespons";
  if (error instanceof TypeError) return "Tidak dapat terhubung ke server";
  return error.message;
}

async function loadProducts(query = "", isSearch = false) {
  const myRequest = ++requestCounter;
  try {
    showLoading(isSearch);
    const response = await fetchWithTimeout(buildUrl(query));
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.products)) {
      throw new Error("Format data dari server tidak sesuai");
    }

    if (myRequest !== requestCounter) return;

    // saring: hanya kategori yang relevan untuk UMKM Bunyu
    currentProducts = data.products.filter((p) =>
      KATEGORI_TAMPIL.includes(p.category)
    );
    renderProducts(currentProducts);
    renderStats(currentProducts);

    // promo & rekomendasi hanya tampil saat tidak sedang mencari
    if (query === "") {
      renderPromo(currentProducts);
      tampilkanPromo(true);
    } else {
      tampilkanPromo(false);
    }
  } catch (error) {
    if (myRequest !== requestCounter) return;
    showError(pesanError(error));
  } finally {
    if (myRequest === requestCounter) hideLoading();
  }
}

/* ===== 4. STATE TAMPILAN ===== */
function showLoading(isSearch) {
  el.errorState.classList.add("hidden");
  el.emptyState.classList.add("hidden");
  if (isSearch) {
    el.loadingCari.classList.remove("hidden");
  } else {
    el.loadingState.classList.remove("hidden");
    el.grid.innerHTML = "";
  }
}

function hideLoading() {
  el.loadingState.classList.add("hidden");
  el.loadingCari.classList.add("hidden");
}

function showError(message) {
  el.grid.innerHTML = "";
  tampilkanPromo(false);
  el.errorTeks.textContent =
    `Gagal memuat data (${message}). Periksa koneksi internet lalu coba lagi.`;
  el.errorState.classList.remove("hidden");
}

function tampilkanPromo(tampil) {
  el.secPromo.classList.toggle("hidden", !tampil);
  el.secRekom.classList.toggle("hidden", !tampil);
}

/* ===== 5. RENDER KE DOM ===== */
// badgeText opsional: dipakai untuk lencana "Diskon X%" / "Rating X.X"
function createCard(product, badgeText = "") {
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  img.className = "card-img";
  img.src = product.thumbnail;
  img.alt = product.title;
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = product.title;

  const category = document.createElement("p");
  category.className = "card-category";
  category.textContent = formatKategori(product.category);

  const price = document.createElement("p");
  price.className = "card-price";
  price.textContent = formatHarga(product.price);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-fav";
  btn.dataset.id = product.id;
  setFavButton(btn, isFav(product.id));
  btn.addEventListener("click", () => toggleFav(product));

  body.append(title, category, price, btn);
  card.append(img, body);

  if (badgeText) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = badgeText;
    card.append(badge);
  }
  return card;
}

function renderProducts(products) {
  if (products.length === 0) {
    el.grid.innerHTML = "";
    el.emptyState.classList.remove("hidden");
    return;
  }
  el.emptyState.classList.add("hidden");
  isiGrid(el.grid, products.map((p) => createCard(p)));
}

// promo = diskon terbesar, rekomendasi = rating tertinggi
function renderPromo(products) {
  const promo = [...products]
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .slice(0, JUMLAH_PROMO);
  const rekom = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, JUMLAH_PROMO);

  isiGrid(
    el.gridPromo,
    promo.map((p) => createCard(p, `Diskon ${Math.round(p.discountPercentage)}%`))
  );
  isiGrid(
    el.gridRekom,
    rekom.map((p) => createCard(p, `Rating ${p.rating.toFixed(1)}`))
  );
}

/* ===== 6. STATISTIK (dari data yang sedang tampil) ===== */
function renderStats(products) {
  if (products.length === 0) {
    el.statRata.textContent = "-";
    el.statTermahal.textContent = "-";
    el.statTermahalNama.textContent = "";
    el.statKategori.textContent = "-";
    return;
  }
  const total = products.reduce((sum, p) => sum + p.price, 0);
  const rata = total / products.length;
  const termahal = products.reduce((max, p) => (p.price > max.price ? p : max));
  const jumlahKategori = new Set(products.map((p) => p.category)).size;

  el.statRata.textContent = formatHarga(rata);
  el.statTermahal.textContent = formatHarga(termahal.price);
  el.statTermahalNama.textContent = termahal.title;
  el.statKategori.textContent = jumlahKategori;
}

/* ===== 7. DEBOUNCE + EVENT (challenge C=2) ===== */
function debounce(fn, delay = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const searchDebounced = debounce((query) => loadProducts(query, true), 500);

el.inputCari.addEventListener("input", (e) => {
  el.loadingCari.classList.remove("hidden");
  searchDebounced(e.target.value.trim());
});

el.btnRetry.addEventListener("click", () => {
  loadProducts(el.inputCari.value.trim());
});

/* ===== FAVORIT (Y=2, localStorage) ===== */
const FAV_KEY = "favoriteProducts";
let memoryFavs = [];   // cadangan jika localStorage diblokir (mis. mode privat)

function getFavs() {
  try {
    const data = JSON.parse(localStorage.getItem(FAV_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return memoryFavs;   // storage diblokir atau data rusak
  }
}

function saveFavs(favs) {
  memoryFavs = favs;
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  } catch (e) {
    // storage diblokir: favorit tetap tersimpan selama halaman terbuka
  }
}

function isFav(id) {
  return getFavs().some((f) => f.id === id);
}

function setFavButton(btn, aktif) {
  btn.setAttribute("aria-pressed", aktif);
  btn.textContent = aktif ? "❌ Hapus dari Favorit" : "⭐ Simpan ke Favorit";
}

function toggleFav(product) {
  const favs = getFavs();
  const next = isFav(product.id)
    ? favs.filter((f) => f.id !== product.id)
    : [...favs, {
        id: product.id,
        title: product.title,
        category: product.category,
        price: product.price,
        thumbnail: product.thumbnail,
      }];
  saveFavs(next);
  renderFavorites();
  syncFavButtons();
}

// samakan teks/status tombol di daftar produk, promo, dan rekomendasi
function syncFavButtons() {
  const ids = getFavs().map((f) => f.id);
  document
    .querySelectorAll("#grid-produk .btn-fav, #grid-promo .btn-fav, #grid-rekomendasi .btn-fav")
    .forEach((btn) => {
      setFavButton(btn, ids.includes(Number(btn.dataset.id)));
    });
}

function renderFavorites() {
  const favs = getFavs();
  el.jumlahFav.textContent = favs.length;
  el.favKosong.classList.toggle("hidden", favs.length > 0);
  isiGrid(el.gridFav, favs.map((f) => createCard(f)));
}

// tombol Favorit di header: tampil/sembunyikan bagian favorit
el.btnFavorit.addEventListener("click", () => {
  const terbuka = el.favSection.classList.toggle("hidden") === false;
  el.btnFavorit.setAttribute("aria-expanded", terbuka);
  if (terbuka) el.favSection.scrollIntoView();
});

/* ===== FORM & VALIDASI (Z=8: minimal satu kategori) ===== */
const dialogUsul = document.getElementById("dialog-usul");
const panelForm = document.getElementById("panel-form");
const panelSukses = document.getElementById("panel-sukses");
const judulSukses = document.getElementById("judul-sukses");
const daftarKategori = document.getElementById("daftar-kategori");

const form = document.getElementById("form-usul");
const inputNama = document.getElementById("nama");
const inputEmail = document.getElementById("email");
const errNama = document.getElementById("err-nama");
const errEmail = document.getElementById("err-email");
const errKategori = document.getElementById("err-kategori");
const pesanSukses = document.getElementById("pesan-sukses");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// checkbox dibuat dari KATEGORI_TAMPIL, jadi sinkron dengan data produk
function buatCheckboxKategori() {
  KATEGORI_TAMPIL.forEach((kat) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.name = "kategori";
    cb.value = kat;
    label.append(cb, formatKategori(kat));
    daftarKategori.appendChild(label);
  });
}

// tiap fungsi mengembalikan pesan error, atau "" kalau valid
function cekNama(nilai) {
  return nilai.trim() === "" ? "Nama wajib diisi." : "";
}

function cekEmail(nilai) {
  const v = nilai.trim();
  if (v === "") return "";   // opsional: kosong dianggap valid
  return EMAIL_REGEX.test(v)
    ? ""
    : "Format email belum benar. Contoh: nama@email.com";
}

function cekKategori() {
  const dipilih = form.querySelectorAll('input[name="kategori"]:checked');
  return dipilih.length === 0 ? "Pilih minimal satu kategori produk." : "";
}

function tampilkanError(inputEl, errEl, pesan) {
  errEl.textContent = pesan ? `⚠ ${pesan}` : "";
  if (inputEl) inputEl.setAttribute("aria-invalid", pesan ? "true" : "false");
}

// buka/tutup popup, dengan cadangan untuk browser yang belum mendukung <dialog>
function bukaModal() {
  if (typeof dialogUsul.showModal === "function") {
    dialogUsul.showModal();
  } else {
    dialogUsul.setAttribute("open", "");
  }
}

function tutupModal() {
  if (typeof dialogUsul.close === "function") {
    dialogUsul.close();
  } else {
    dialogUsul.removeAttribute("open");
  }
}

// buka popup: selalu mulai dari form yang bersih
function bukaDialog() {
  form.reset();
  tampilkanError(inputNama, errNama, "");
  tampilkanError(inputEmail, errEmail, "");
  tampilkanError(null, errKategori, "");
  panelForm.classList.remove("hidden");
  panelSukses.classList.add("hidden");
  bukaModal();
  inputNama.focus();
}

document.getElementById("btn-usul").addEventListener("click", bukaDialog);
document.getElementById("btn-batal").addEventListener("click", tutupModal);
document.getElementById("btn-tutup-sukses").addEventListener("click", tutupModal);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const pesanNama = cekNama(inputNama.value);
  const pesanEmail = cekEmail(inputEmail.value);
  const pesanKategori = cekKategori();

  tampilkanError(inputNama, errNama, pesanNama);
  tampilkanError(inputEmail, errEmail, pesanEmail);
  tampilkanError(null, errKategori, pesanKategori);

  if (pesanNama) return inputNama.focus();
  if (pesanEmail) return inputEmail.focus();
  if (pesanKategori) {
    return form.querySelector('input[name="kategori"]').focus();
  }

  // semua valid: ringkas data, kosongkan form, tampilkan centang besar
  const dipilih = Array.from(
    form.querySelectorAll('input[name="kategori"]:checked')
  ).map((c) => formatKategori(c.value));

  pesanSukses.textContent =
    `Terima kasih, ${inputNama.value.trim()}. ` +
    `Usulan kategori [${dipilih.join(", ")}] berhasil dicatat.`;
  form.reset();
  panelForm.classList.add("hidden");
  panelSukses.classList.remove("hidden");
  judulSukses.focus();
});

// hapus pesan error begitu pengguna memperbaiki isian
inputNama.addEventListener("input", () => tampilkanError(inputNama, errNama, ""));
inputEmail.addEventListener("input", () => tampilkanError(inputEmail, errEmail, ""));
daftarKategori.addEventListener("change", () => tampilkanError(null, errKategori, ""));

buatCheckboxKategori();

/* ===== 8. JALANKAN SAAT HALAMAN DIBUKA ===== */
renderFavorites();
loadProducts();