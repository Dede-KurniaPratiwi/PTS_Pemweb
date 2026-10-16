/* ===== 1. KONFIGURASI ===== */
const API_BASE = "https://dummyjson.com/products";
const LIMIT = 0;        // 0 = ambil semua produk dari DummyJSON
const KURS = 16000;     // kurs tetap contoh (USD ke Rupiah), bukan kurs real-time

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
  statKategori: document.getElementById("stat-kategori"),
  gridFav: document.getElementById("grid-favorit"),
  favKosong: document.getElementById("fav-kosong"),
  favSection: document.getElementById("favorit"),
  jumlahFav: document.getElementById("jumlah-fav"),
  btnFavorit: document.getElementById("btn-favorit"),
};

/* ===== 2. FORMAT ===== */
function formatHarga(usd) {
  return (usd * KURS).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

// "kitchen-accessories" -> "Kitchen Accessories"
function formatKategori(kategori) {
  return kategori
    .split("-")
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(" ");
}

/* ===== 3. FETCH DATA ===== */
function buildUrl(query) {
  return query
    ? `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${LIMIT}`
    : `${API_BASE}?limit=${LIMIT}`;
}

async function loadProducts(query = "", isSearch = false) {
  const myRequest = ++requestCounter;
  try {
    showLoading(isSearch);
    const response = await fetch(buildUrl(query));
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();

    if (myRequest !== requestCounter) return;

    // saring: hanya kategori yang relevan untuk UMKM Bunyu
    currentProducts = data.products.filter((p) =>
      KATEGORI_TAMPIL.includes(p.category)
    );
    renderProducts(currentProducts);
    renderStats(currentProducts);
  } catch (error) {
    if (myRequest !== requestCounter) return;
    showError(error.message);
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
  el.errorTeks.textContent =
    `Gagal memuat data (${message}). Periksa koneksi internet lalu coba lagi.`;
  el.errorState.classList.remove("hidden");
}

/* ===== 5. RENDER KE DOM ===== */
function createCard(product) {
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
  return card;
}

function renderProducts(products) {
  el.grid.innerHTML = "";
  if (products.length === 0) {
    el.emptyState.classList.remove("hidden");
    return;
  }
  el.emptyState.classList.add("hidden");
  el.grid.append(...products.map(createCard));
}

/* ===== 6. STATISTIK (dari data yang sedang tampil) ===== */
function renderStats(products) {
  if (products.length === 0) {
    el.statRata.textContent = "-";
    el.statTermahal.textContent = "-";
    el.statKategori.textContent = "-";
    return;
  }
  const total = products.reduce((sum, p) => sum + p.price, 0);
  const rata = total / products.length;
  const termahal = products.reduce((max, p) => (p.price > max.price ? p : max));
  const jumlahKategori = new Set(products.map((p) => p.category)).size;

  el.statRata.textContent = formatHarga(rata);
  el.statTermahal.textContent = `${termahal.title} (${formatHarga(termahal.price)})`;
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

function getFavs() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch {
    return [];   // kalau data rusak, anggap kosong
  }
}

function saveFavs(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
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

// samakan teks/status tombol di grid utama dengan data favorit
function syncFavButtons() {
  const ids = getFavs().map((f) => f.id);
  document.querySelectorAll("#grid-produk .btn-fav").forEach((btn) => {
    setFavButton(btn, ids.includes(Number(btn.dataset.id)));
  });
}

function renderFavorites() {
  const favs = getFavs();
  el.jumlahFav.textContent = favs.length;
  el.favKosong.classList.toggle("hidden", favs.length > 0);
  el.gridFav.innerHTML = "";
  el.gridFav.append(...favs.map(createCard));
}

// tombol Favorit di header: tampil/sembunyikan bagian favorit
el.btnFavorit.addEventListener("click", () => {
  const terbuka = el.favSection.classList.toggle("hidden") === false;
  el.btnFavorit.setAttribute("aria-expanded", terbuka);
  if (terbuka) el.favSection.scrollIntoView();
});

/* ===== FORM & VALIDASI (Z=8: minimal satu kategori) ===== */
const form = document.getElementById("form-usul");
const inputNama = document.getElementById("nama");
const inputEmail = document.getElementById("email");
const errNama = document.getElementById("err-nama");
const errEmail = document.getElementById("err-email");
const errKategori = document.getElementById("err-kategori");
const pesanSukses = document.getElementById("pesan-sukses");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  pesanSukses.textContent = "";

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

  // semua valid: ringkas data lalu kosongkan form
  const dipilih = Array.from(
    form.querySelectorAll('input[name="kategori"]:checked')
  ).map((c) => c.value);

  pesanSukses.textContent =
    `✔ Terima kasih, ${inputNama.value.trim()}. ` +
    `Usulan kategori [${dipilih.join(", ")}] berhasil dicatat.`;
  form.reset();
});

// hapus pesan error begitu pengguna memperbaiki isian
inputNama.addEventListener("input", () => tampilkanError(inputNama, errNama, ""));
inputEmail.addEventListener("input", () => tampilkanError(inputEmail, errEmail, ""));
form.querySelectorAll('input[name="kategori"]').forEach((cb) =>
  cb.addEventListener("change", () => tampilkanError(null, errKategori, ""))
);

/* ===== 8. JALANKAN SAAT HALAMAN DIBUKA ===== */
renderFavorites();
loadProducts();