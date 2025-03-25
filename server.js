const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";
const path = require("path");

// ✅ ต้องสร้าง Express app ก่อนใช้ middleware
const app = express();

// ✅ ใช้งาน Middleware หลังจากประกาศ app แล้ว
app.use(cors());
app.use(bodyParser.json());

// ✅ ให้ Express เสิร์ฟไฟล์ Static (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "❌ ไม่มี Token โปรดเข้าสู่ระบบ" });

    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "❌ Token ไม่ถูกต้อง" });
        req.user = user;
        next();
    });
}

app.get("/auth-check", authenticateToken, (req, res) => {
    res.json({ message: "✅ Token ถูกต้อง", user: req.user });
});

function isAdmin(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "❌ กรุณาเข้าสู่ระบบ" });

    try {
        const user = jwt.verify(token.split(" ")[1], SECRET_KEY);
        console.log("🔍 ตรวจสอบสิทธิ์ Admin:", user); // ✅ Debug ข้อมูล

        if (user.is_admin !== 1) {
            return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์เข้าถึง" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: "❌ Token ไม่ถูกต้อง" });
    }
}

// ✅ สมัครสมาชิก
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err) => {
        if (err) {
            return res.status(400).json({ error: "❌ ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
        }
        res.json({ message: "✅ สมัครสมาชิกสำเร็จ!" });
    });
});

// ✅ ล็อกอิน
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
        }

        console.log("✅ ตรวจสอบข้อมูลผู้ใช้จาก Database:", user); // ✅ Debug User Data

        const token = jwt.sign(
            { userId: user.id, username: user.username, is_admin: user.is_admin }, 
            SECRET_KEY, 
            { expiresIn: "1h" }
        );

        res.json({ message: "✅ ล็อกอินสำเร็จ!", token, is_admin: user.is_admin });
    });
});


// ✅ ดึงรายชื่อเกม
app.get("/games", (req, res) => {
  db.all("SELECT * FROM games", [], (err, games) => {
    res.json(games);
  });
});
app.get("/products/:productId", (req, res) => {
    const productId = parseInt(req.params.productId);
    console.log("🔍 กำลังดึงข้อมูลสินค้าสำหรับ productId:", productId);

    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
        if (err) {
            console.error("❌ โหลดสินค้าไม่สำเร็จ:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (!product) {
            return res.status(404).json({ error: "❌ ไม่พบสินค้า" });
        }
        console.log("📦 สินค้าที่ดึงมา:", product);
        res.json(product);
    });
});

app.get("/products/game/:gameId", (req, res) => {
    const gameId = parseInt(req.params.gameId);
    console.log("🔍 กำลังดึงสินค้าของเกม:", gameId);

    db.all("SELECT * FROM products WHERE game_id = ?", [gameId], (err, products) => {
        if (err) {
            console.error("❌ โหลดสินค้าไม่สำเร็จ:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (!products || products.length === 0) {
            return res.status(404).json({ error: "❌ ไม่พบสินค้าในเกมนี้" });
        }
        console.log("📦 สินค้าทั้งหมดในเกม:", products);
        res.json(products);
    });
});


// API ดึงสินค้าตาม product_id (ใช้สำหรับหน้า Checkout)




// ✅ สร้างออเดอร์ (เติมเกม)
app.post("/order", (req, res) => {
  const { userId, productId } = req.body;
  db.run("INSERT INTO orders (user_id, product_id) VALUES (?, ?)", [userId, productId], (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to create order" });
    }
    res.json({ message: "Order placed successfully" });
  });
});

// ✅ ดึงออเดอร์ของผู้ใช้
app.get("/orders/:userId", (req, res) => {
  const userId = req.params.userId;
  db.all("SELECT * FROM orders WHERE user_id = ?", [userId], (err, orders) => {
    res.json(orders);
  });
});

app.post("/upload-slip", upload.single("slip"), (req, res) => {
    const { productId, paymentMethod } = req.body;
    const slipFile = req.file;

    if (!slipFile) {
        return res.status(400).json({ error: "กรุณาอัปโหลดไฟล์สลิป" });
    }

    db.run("INSERT INTO orders (user_id, product_id, status, slip) VALUES (?, ?, 'pending', ?)", 
        [1, productId, slipFile.filename], (err) => {
        if (err) return res.status(500).json({ error: "บันทึกออเดอร์ล้มเหลว" });

        res.json({ message: "📤 อัปโหลดสลิปสำเร็จ! รอการตรวจสอบ" });
    });
});

// app.post("/register", async (req, res) => {
//     const { username, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);

//     db.run("INSERT INTO users (username, password) VALUES (?, ?)", 
//         [username, hashedPassword], (err) => {
//         if (err) {
//             return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
//         }
//         res.json({ message: "✅ สมัครสมาชิกสำเร็จ!" });
//     });
// });

// app.post("/login", (req, res) => {
//     const { username, password } = req.body;

//     db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({ error: "❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
//         }

//         const token = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
//         res.json({ message: "✅ ล็อกอินสำเร็จ!", token });
//     });
// });

app.get("/users", authenticateToken, (req, res) => {
    db.all("SELECT id, username FROM users", [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: "❌ ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
        }
        res.json(users);
    });
});

app.post("/admin/products", (req, res) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "❌ กรุณาเข้าสู่ระบบ" });

    try {
        const user = jwt.verify(token.split(" ")[1], SECRET_KEY);
        console.log("📢 ตรวจสอบ Token:", user); // ✅ Debug Token

        if (!user.is_admin || user.is_admin != 1) {
            return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์เข้าถึง" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: "❌ Token ไม่ถูกต้อง" });
    }
});

// ✅ รันเซิร์ฟเวอร์
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
