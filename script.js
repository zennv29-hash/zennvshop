const API_KEY = "907855e5e72d206fa82dd9c818768045";
const BASE_URL = "https://corsproxy.io/?https://premku.com/api"; 

let paymentPolling = null;
let isPromoActive = false; // Status global promo aktif atau tidak

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});

// FUNGSI CEK PROMO DI MENU HOME
function cekPromoHome() {
    const inputRes = document.getElementById("home-promo-input");
    const kode = inputRes.value.trim();
    const msg = document.getElementById("home-promo-msg");
    const btn = document.getElementById("home-promo-btn");

    msg.style.display = "block";

    if (kode === "ZENNVMODZ978") {
        if (isPromoActive) {
            msg.style.color = "#fbbf24"; 
            msg.innerText = "⚠️ Kode promo ini sudah terpakai!";
        } else {
            isPromoActive = true;
            msg.style.color = "#34d399"; 
            msg.innerText = "✓ Berhasil! Kode diterapkan. Potongan Rp 1.000 aktif untuk semua produk.";
            
            inputRes.disabled = true;
            inputRes.style.opacity = "0.7";
            btn.disabled = true;
            btn.style.background = "#334155";
            btn.style.color = "#94a3b8";
            btn.innerText = "Terpakai";

            // Refresh ulang produk biar kalkulasi diskon aman & harga coret muncul
            loadProducts();
        }
    } else if (kode === "") {
        msg.style.color = "#f43f5e";
        msg.innerText = "Kolom kode promo masih kosong!";
    } else {
        msg.style.color = "#f43f5e";
        msg.innerText = "✕ Kode promo tidak valid.";
    }
}

// Fungsi koneksi API utama
async function callPremku(endpoint, data = {}) {
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: API_KEY, ...data })
        });
        return await response.json();
    } catch (e) {
        console.error("API Error:", e);
        return { success: false, message: "Koneksi ke Premku terputus." };
    }
}

// 1. AMBIL DATA PRODUK (DISKON FIX POTONG 1K DARI HARGA NORMAL)
async function loadProducts() {
    const container = document.getElementById("product-container");
    
    if (container.innerHTML !== "") {
        container.innerHTML = `<div class="loading" style="grid-column: 1 / -1;">Memperbarui katalog dan harga...</div>`;
    }

    const res = await callPremku("products");
    
    const loadingEl = document.getElementById("loading-products");
    if(loadingEl) loadingEl.classList.add("hidden");

    if (res.success && res.products) {
        container.innerHTML = "";
        res.products.forEach(p => {
            if(p.status === "available") {
                
                let basePrice = p.price;
                let productName = p.name ? p.name.toLowerCase() : "";
                
                // ========================================================
                // ATURAN 1: TENTUKAN HARGA JUAL NORMAL LU
                // ========================================================
                let hargaJualNormal = basePrice + 3000; 
                
                if (basePrice <= 500) {
                    hargaJualNormal = 5000;
                } else if (basePrice <= 1000 || productName.includes("alight motion") || productName.includes("viu")) {
                    hargaJualNormal = 8000; 
                } else if (basePrice <= 5000) {
                    hargaJualNormal = 30000; 
                }
                
                let hargaTampil = hargaJualNormal;
                let htmlHargaCoret = ""; 

                // ========================================================
                // ATURAN 2: JIKA KODE PROMO AKTIF (POTONG 1K DARI HARGA NORMAL)
                // ========================================================
                if (isPromoActive) {
                    // Harga toko sebelum diskon dijadikan harga coret
                    htmlHargaCoret = `<span style="text-decoration: line-through; color: #ef4444; font-size: 0.75rem; font-weight: 500; margin-bottom: 2px;">Rp ${hargaJualNormal.toLocaleString('id-ID')}</span>`;
                    
                    // Request: Potong dikit aja ngurangin 1k dari harga normal biar ALL produk tetep untung & anti-minus
                    hargaTampil = hargaJualNormal - 1000; 
                }

                // LOGIKA TOMBOL & TEKS BERDASARKAN STOK
                let tombolHtml = "";
                let warnaStok = "#71717a"; 

                if (p.stock <= 0) {
                    warnaStok = "#ef4444"; 
                    tombolHtml = `<button disabled style="padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; font-weight: 600; background: #1e293b; color: #64748b; border: 1px solid #334155; cursor: not-allowed;">Habis</button>`;
                } else {
                    tombolHtml = `<button onclick="prosesBeli(${p.id}, '${p.name}', ${hargaTampil})" style="padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; font-weight: 600; cursor: pointer;">Beli</button>`;
                }

                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <div class="card-body-left">
                        <div class="product-name" style="font-size: 0.95rem; font-weight: 600; color: #ffffff; margin-bottom: 2px;">${p.name}</div>
                        <p style="color: #a1a1aa; font-size: 0.72rem; margin: 0; line-height: 1.2;">⚡ Instan QRIS Otomatis</p>
                    </div>
                    <div class="card-body-right" style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        <div class="product-meta" style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2;">
                            ${htmlHargaCoret}
                            <span class="price" style="font-weight: 700; color: #38bdf8; font-size: 1rem;">Rp ${hargaTampil.toLocaleString('id-ID')}</span>
                            <span class="stock" style="font-size: 0.68rem; color: ${warnaStok}; font-weight: 500;">Stok: ${p.stock}</span>
                        </div>
                        ${tombolHtml}
                    </div>
                `;
                container.appendChild(card);
            }
        });
    } else {
        container.innerHTML = `<p style="color:#f43f5e; text-align:center; width:100%; font-size: 0.85rem;">Gagal mengambil data produk.</p>`;
    }
}

// 2. KLIK BELI -> BUAT QRIS OTOMATIS (VALID 24 JAM)
async function prosesBeli(productId, productName, harga) {
    document.getElementById("modal-step-1").classList.remove("hidden");
    document.getElementById("modal-step-2").classList.add("hidden");
    document.getElementById("checkout-modal").classList.remove("hidden");
    
    document.getElementById("modal-product-name").innerText = productName;
    document.getElementById("qris-image").src = "";
    document.getElementById("qris-total").innerText = "Membuat QRIS...";
    document.getElementById("qris-expired").innerText = "Menghubungkan ke gateway...";

    const payRes = await callPremku("pay", { amount: harga, expired: 1440, expired_time: 1440 });

    if (payRes.success && (payRes.data || payRes.invoice)) {
        const dataObj = payRes.data || payRes;
        const depositInvoice = dataObj.invoice || dataObj.id || dataObj.trx_id || dataObj.reference || payRes.invoice;
        
        if (!depositInvoice) {
            document.getElementById("qris-expired").innerText = "Gagal mengunci ID transaksi.";
            return;
        }

        document.getElementById("qris-image").src = dataObj.qr_image || dataObj.qr_link || "";
        
        const totalBayar = dataObj.total_bayar || dataObj.amount || harga;
        document.getElementById("qris-total").innerText = `Rp ${parseInt(totalBayar).toLocaleString('id-ID')}`;
        
        document.getElementById("qris-expired").innerText = "Menunggu pembayaran (Valid 24 Jam)";

        startPaymentPolling(depositInvoice, productId);
    } else {
        document.getElementById("qris-expired").innerText = "Gagal membuat QRIS otomatis.";
        alert("Respon server bermasalah: " + (payRes.message || "Unknown error"));
    }
}

// 3. CEK MUTASI REAL-TIME
function startPaymentPolling(depositInvoice, productId) {
    if(paymentPolling) clearInterval(paymentPolling);

    paymentPolling = setInterval(async () => {
        const statusRes = await callPremku("pay_status", { invoice: depositInvoice });

        let status = "";
        if (statusRes.data && statusRes.data.status) status = statusRes.data.status.toLowerCase();
        else if (statusRes.status) status = statusRes.status.toLowerCase();

        if (status === "success" || status === "paid" || statusRes.success === true) {
            clearInterval(paymentPolling);
            document.getElementById("qris-expired").innerText = "Pembayaran terverifikasi! Mengambil akun...";
            eksekusiOrderOtomatis(productId);
        } else if (status === "failed" || status === "expired") {
            clearInterval(paymentPolling);
            document.getElementById("qris-expired").innerText = "Transaksi kedaluwarsa atau dibatalkan.";
        } else {
            document.getElementById("qris-expired").innerText = "Mengecek mutasi... Silakan selesaikan pembayaran.";
        }
    }, 4000); 
}

// 4. POTONG SALDO & KIRIM DATA KE SERVER PUSAT
async function eksekusiOrderOtomatis(productId) {
    document.getElementById("qris-total").innerText = "Memproses Akun...";
    
    const refId = "ZENV-" + Date.now();
    const orderRes = await callPremku("order", {
        product_id: productId,
        qty: 1,
        ref_id: refId
    });

    const orderInvoice = orderRes.invoice || (orderRes.data ? orderRes.data.invoice : null);

    if ((orderRes.success || orderRes.invoice) && orderInvoice) {
        ambilBarangPesanan(orderInvoice);
    } else {
        const alasanGagal = orderRes.message || "Gagal mengorder ke server pusat.";
        document.getElementById("qris-expired").innerText = `Gagal: ${alasanGagal}. Mencoba kembali...`;
        
        setTimeout(() => { eksekusiOrderOtomatis(productId); }, 4000);
    }
}

// 5. AMBIL DATA DATA AKUN EMAIL + PASSWORD & VOICE ID
function ambilBarangPesanan(orderInvoice) {
    let orderPoll = setInterval(async () => {
        const deliveryRes = await callPremku("status", { invoice: orderInvoice });
        
        if (deliveryRes.success && (deliveryRes.status === "success" || deliveryRes.accounts)) {
            clearInterval(orderPoll);
            
            document.getElementById("modal-step-1").classList.add("hidden");
            document.getElementById("modal-step-2").classList.remove("hidden");
            
            const deliveryBox = document.getElementById("account-delivery-box");
            deliveryBox.innerHTML = "";
            
            if (deliveryRes.accounts && deliveryRes.accounts.length > 0) {
                deliveryRes.accounts.forEach(acc => {
                    const box = document.createElement("div");
                    box.className = "account-box";
                    
                    const voiceId = acc.voice_id || "ZNV-VOICE-" + Math.floor(100000 + Math.random() * 900000);
                    
                    box.innerHTML = `
                        <strong>EMAIL / USERNAME:</strong><br>${acc.username}<br><br>
                        <strong>PASSWORD:</strong><br>${acc.password}<br><br>
                        <strong>VOICE ID:</strong><br><span style="color: #60a5fa; font-weight: bold; font-family: monospace;">${voiceId}</span>
                    `;
                    deliveryBox.appendChild(box);
                });
            } else {
                const globalVoiceId = "ZNV-VOICE-" + Math.floor(100000 + Math.random() * 900000);
                deliveryBox.innerHTML = `
                    <div class="account-box">
                        Akun berhasil dibeli!<br><br>
                        <strong>VOICE ID TRANSAKSI:</strong><br><span style="color: #60a5fa; font-weight: bold;">${globalVoiceId}</span><br><br>
                        Silakan cek menu Riwayat/Mutasi di akun Premku pusat Anda apabila data utama terlambat sinkron.
                    </div>`;
            }
        }
    }, 3000); 
}

function closeModal() {
    if(paymentPolling) clearInterval(paymentPolling);
    document.getElementById("checkout-modal").classList.add("hidden");
}