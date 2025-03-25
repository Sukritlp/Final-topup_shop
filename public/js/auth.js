document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
});

function updateNavbar() {
    const token = localStorage.getItem("token");
    const userSection = document.getElementById("user-section");

    if (token) {
        try {
            console.log("🔑 Raw Token:", token); // ✅ ตรวจสอบ Token ที่ดึงมา
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log("✅ Payload ที่ถอดรหัส:", payload); // ✅ ตรวจสอบ Payload

            if (!payload || typeof payload.is_admin === "undefined") {
                console.error("❌ Token ไม่มีค่า is_admin หรือเสียหาย!", payload);
                localStorage.removeItem("token");
                return;
            }

            let adminButton = Number(payload.is_admin) === 1 
                ? `<button onclick="goToAdmin()" class="bg-green-500 px-3 py-1 rounded-lg ml-2">Admin Panel</button>` 
                : "";

            userSection.innerHTML = `
                <span class="text-white font-bold">${payload.username}</span>
                ${adminButton}
                <button onclick="logout()" class="bg-red-500 px-3 py-1 rounded-lg ml-2">ออกจากระบบ</button>
            `;
        } catch (error) {
            console.error("❌ Error ขณะถอดรหัส Token:", error);
            console.error("⚠️ Token อาจเสียหาย หรือไม่ได้อยู่ในรูปแบบ JWT:", token);
            localStorage.removeItem("token");
        }
    } else {
        userSection.innerHTML = `
            <button id="login-btn" onclick="goToLogin()" class="text-white text-2xl">👤</button>
        `;
    }
}
function goToAdmin() {
    window.location.href = "admin-dashboard.html";
}

function logout() {
    localStorage.removeItem("token");
    alert("👋 ออกจากระบบแล้ว!");
    window.location.reload();
}
