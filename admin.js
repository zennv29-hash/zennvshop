const API_KEY = "907855e5e72d206fa82dd9c818768045";
const BASE_URL = "https://corsproxy.io/?https://premku.com/api";

document.addEventListener("DOMContentLoaded", () => {
    fetchAdminProfile();
});

async function fetchAdminProfile() {
    const profileBox = document.getElementById("admin-profile");
    try {
        const response = await fetch(`${BASE_URL}/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: API_KEY })
        });
        const res = await response.json();

        if (res.success && res.data) {
            profileBox.className = ""; 
            profileBox.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; text-align: left;">
                    <div><strong>Username Admin:</strong> <p style="color:var(--primary); font-size:1.1rem; font-weight:bold; margin-top:5px;">${res.data.username}</p></div>
                    <div><strong>WhatsApp:</strong> <p style="margin-top:5px;">${res.data.whatsapp || '-'}</p></div>
                    <div><strong>Sisa Saldo Anda:</strong> <p style="font-size: 1.8rem; color: var(--success); font-weight: bold; margin-top:5px;">Rp ${res.data.saldo.toLocaleString('id-ID')}</p></div>
                </div>
            `;
        } else {
            profileBox.innerHTML = `<span style="color:#f43f5e;">Gagal muat data: ${res.message}</span>`;
        }
    } catch (e) {
        profileBox.innerHTML = `<span style="color:#f43f5e;">Terjadi kesalahan koneksi ke server.</span>`;
    }
}