/* ===== 1. KONFIGURASI API (commit: add API configuration) ===== */
const API_BASE = "https://dummyjson.com/products";
const LIMIT = 100;

let currentProducts = [];   // produk yang sedang tampil
let requestCounter = 0;     // penanda permintaan terbaru

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
};

/* ===== 2. FETCH DATA (commit: implement fetch data) ===== */
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

    // abaikan respons lama kalau sudah ada permintaan yang lebih baru
    if (myRequest !== requestCounter) return;

    currentProducts = data.products;
    renderProducts(currentProducts);
    renderStats(currentProducts);
  } catch (error) {
    if (myRequest !== requestCounter) return;
    showError(error.message);
  } finally {
    if (myRequest === requestCounter) hideLoading();
  }
}

/* ===== 3. TAMPILAN STATE ===== */
function showLoading(isSearch) {
  el.errorState.classList.add("hidden");
  el.emptyState.classList.add("hidden");
  if (isSearch) {
    el.loadingCari.classList.remove("hidden");      // loading kecil saat cari
  } else {
    el.loadingState.classList.remove("hidden");     // loading penuh saat awal
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

/* ===== 4. RENDER KE DOM (commit: render products to DOM) ===== */
function formatHarga(angka) {
  return angka.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

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
  category.textContent = product.category;

  const price = document.createElement("p");
  price.className = "card-price";
  price.textContent = formatHarga(product.price);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-fav";
  btn.dataset.id = product.id;
  btn.setAttribute("aria-pressed", "false");
  btn.textContent = "⭐ Simpan ke Favorit";   // logika favorit: tahap berikutnya

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
  const cards = products.map(createCard);
  el.grid.append(...cards);
}

/* ===== 5. STATISTIK (dihitung dari data yang sedang tampil) ===== */
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

/* ===== 6. DEBOUNCE + EVENT (challenge C=2) ===== */
function debounce(fn, delay = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const searchDebounced = debounce((query) => loadProducts(query, true), 500);

el.inputCari.addEventListener("input", (e) => {
  el.loadingCari.classList.remove("hidden");   // tampil sejak mulai mengetik
  searchDebounced(e.target.value.trim());
});

el.btnRetry.addEventListener("click", () => {
  loadProducts(el.inputCari.value.trim());
});

/* ===== 7. JALANKAN SAAT HALAMAN DIBUKA ===== */
loadProducts();