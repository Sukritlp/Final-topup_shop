document.addEventListener("DOMContentLoaded", () => {
    checkAdminAccess();
});

function checkAdminAccess() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้! (ไม่มี Token)");
        window.location.href = "index.html";
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("🎯 Payload ที่ถอดรหัส:", payload); // ✅ Debug Token

        // เช็คว่ามีค่า is_admin หรือไม่
        if (typeof payload.is_admin === "undefined") {
            console.error("❌ ไม่มีค่า is_admin ใน Token!", payload);
        }

        // 🔥 ปรับเงื่อนไขให้แน่ใจว่า is_admin เช็คถูกต้อง
        if (Number(payload.is_admin) !== 1) {
            console.error("❌ ไม่ใช่แอดมิน!", payload);
            alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
            window.location.href = "index.html";
        } else {
            console.log("✅ คุณเป็นแอดมิน! ยินดีต้อนรับเข้าสู่ Admin Panel");
        }
    } catch (error) {
        console.error("❌ Token ไม่ถูกต้อง หรือหมดอายุ:", error);
        localStorage.removeItem("token");
        window.location.href = "index.html";
    }
}

async function addProduct() {
    const game_id = document.getElementById("game_id").value;
    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const token = localStorage.getItem("token");

    if (!token) {
        alert("❌ กรุณาเข้าสู่ระบบแอดมินก่อน");
        window.location.href = "login.html";
        return;
    }

    try {
        console.log("🔑 Token ที่ถูกส่งไป:", token); // ✅ Debug Token

        let res = await fetch("http://localhost:3000/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ game_id, name, price })
        });

        let data = await res.json();
        console.log("📦 ผลลัพธ์การเพิ่มสินค้า:", data);

        if (!res.ok) throw new Error(data.error || "❌ ไม่สามารถเพิ่มสินค้าได้!");
        alert("✅ เพิ่มสินค้าสำเร็จ!");
    } catch (error) {
        console.error("❌ Error ขณะเพิ่มสินค้า:", error);
        alert(error.message);
    }
}

async function loadOrders() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้!");
        window.location.href = "index.html";
        return;
    }

    try {
        let res = await fetch("http://localhost:3000/admin/orders", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("❌ ไม่สามารถโหลดคำสั่งซื้อได้!");

        let orders = await res.json();
        console.log("📜 รายการคำสั่งซื้อ:", orders);

        let orderList = document.getElementById("order-list");
        orderList.innerHTML = "";
        orders.forEach(order => {
            let li = document.createElement("li");
            li.textContent = `🛒 Order #${order.id} - ${order.status}`;
            orderList.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Error ขณะโหลดคำสั่งซื้อ:", error);
        alert("❌ โหลดคำสั่งซื้อไม่สำเร็จ!");
    }
}


async function deleteProduct() {
    const productId = document.getElementById("delete_id").value;
    const token = localStorage.getItem("token");

    let res = await fetch(`http://localhost:3000/admin/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    let data = await res.json();
    alert(data.message);
}
