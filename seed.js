const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.sqlite");

// เพิ่ม Users (จำลอง 20 คน)
const users = [];
for (let i = 1; i <= 20; i++) {
  users.push(["user" + i, "pass" + i]);
}
db.serialize(() => {
  db.run("DELETE FROM users"); // ล้างข้อมูลเก่า
  const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  users.forEach((user) => stmt.run(user));
  stmt.finalize();
});

// เพิ่ม Games (จำลอง 5 เกม)
const games = [
    ["ROV"], ["Free Fire"], ["PUBG Mobile"], ["Genshin Impact"], ["Valorant"],
    ["League of Legends"], ["Apex Legends"], ["Call of Duty Mobile"], ["Dota 2"], ["Minecraft"],
    ["Honkai Star Rail"], ["FIFA Mobile"], ["Clash Royale"], ["Among Us"], ["Diablo Immortal"],
    ["Tower of Fantasy"], ["Mobile Legends"], ["ARK: Survival Evolved"], ["Brawl Stars"], ["Warframe"]
  ];
  
db.serialize(() => {
  db.run("DELETE FROM games");
  const stmt = db.prepare("INSERT INTO games (name) VALUES (?)");
  games.forEach((game) => stmt.run(game));
  stmt.finalize();
});

// เพิ่ม Products (จำลอง 20 สินค้า)
const products = [];
for (let i = 1; i <= 20; i++) {
    const gameId = (i % 20) + 1; // กระจายสินค้าให้ 20 เกม
  products.push([gameId, "Item " + i, (i * 10) % 200 + 50]); // ราคาสุ่มระหว่าง 50-200
}
db.serialize(() => {
  db.run("DELETE FROM products");
  const stmt = db.prepare("INSERT INTO products (game_id, name, price) VALUES (?, ?, ?)");
  products.forEach((product) => stmt.run(product));
  stmt.finalize();
});

// เพิ่ม Orders (จำลอง 20 รายการ)
const orders = [];
for (let i = 1; i <= 20; i++) {
  const userId = (i % 10) + 1; // สลับผู้ใช้ไปเรื่อยๆ
  const productId = (i % 20) + 1;
  orders.push([userId, productId, "pending"]);
}
db.serialize(() => {
  db.run("DELETE FROM orders");
  const stmt = db.prepare("INSERT INTO orders (user_id, product_id, status) VALUES (?, ?, ?)");
  orders.forEach((order) => stmt.run(order));
  stmt.finalize();
});

console.log("✅ Seed data added successfully!");
db.close();
