const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

// ===== CAMERA =====
let camera = {x:0, y:0};
let gameOver = false;

// ===== PLAYER =====
let player = {
  x: 100,
  y: 300,
  w: 32,
  h: 48,
  vx: 0,
  vy: 0,
  speed: 4,
  jumpPower: 12,
  onGround: false,
  hp: 100,
  score: 0,   // คะแนน
  distance: 0 // ระยะทาง
};

// ===== CONTROL =====
let keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ===== PLATFORMS =====
let platforms = [
  {x:0, y:400, w:2000, h:50} // พื้นหลักยาว
];

// เกาะเล็กๆ
for(let i=1;i<15;i++){
  platforms.push({x:i*150, y:300 - (i%3)*50, w:120, h:20});
}

// แยกพื้นใหญ่/เกาะ
let groundPlatforms = platforms.filter(p => p.h >= 40);
let smallPlatforms = platforms.filter(p => p.h < 40);

// ===== ENEMIES =====
let enemies = [];
function spawnEnemy(x,y){
  enemies.push({x:x, y:y, w:32, h:32, vx:2, alive:true});
}

// spawn เริ่มต้นบนพื้นใหญ่
groundPlatforms.forEach(p => {
  if(Math.random() < 0.5){
    let ySpawn = p.y - 32;
    spawnEnemy(p.x + Math.random()*(p.w-32), ySpawn);
  }
});

// ===== GAME LOOP =====
function update() {
  if(gameOver) return;

  // เดินซ้าย/ขวา
  player.vx = 0;
  if(keys["arrowleft"]) player.vx = -player.speed;
  if(keys["arrowright"]) player.vx = player.speed;

  // กระโดด
  if(keys["arrowup"] && player.onGround){
    player.vy = -player.jumpPower;
    player.onGround = false;
  }

  // แรงโน้มถ่วง
  player.vy += 0.6;

  // เคลื่อนที่
  player.x += player.vx;
  player.y += player.vy;

  // อัปเดตระยะทาง (เดินไปขวา)
  if(player.vx > 0) player.distance += player.vx;

  // ชนแพลตฟอร์ม
  player.onGround = false;
  platforms.forEach(p => {
    if(player.x < p.x + p.w &&
       player.x + player.w > p.x &&
       player.y < p.y + p.h &&
       player.y + player.h > p.y){
         if(player.vy > 0 && player.y + player.h - player.vy <= p.y){
           player.y = p.y - player.h;
           player.vy = 0;
           player.onGround = true;
         }
       }
  });

  // ตกพื้น
  if(player.y > H) player.y = 300;

  // ===== UPDATE ENEMIES =====
  enemies.forEach(e => {
    if(!e.alive) return;

    // แรงโน้มถ่วง
    e.vy = e.vy || 0;
    e.vy += 0.6;
    e.x += e.vx;
    e.y += e.vy;

    // ชนแพลตฟอร์ม
    e.onGround = false;
    platforms.forEach(p => {
      if(e.x < p.x + p.w &&
         e.x + e.w > p.x &&
         e.y < p.y + p.h &&
         e.y + e.h > p.y){
           if(e.vy > 0 && e.y + e.h - e.vy <= p.y){
             e.y = p.y - e.h;
             e.vy = 0;
             e.onGround = true;
           }
         }
    });

    // เดินกลับเมื่อชนขอบแพลตฟอร์ม
    let onPlat = platforms.find(p => e.y + e.h === p.y && e.x + e.w > p.x && e.x < p.x + p.w);
    if(onPlat){
      if(e.x <= onPlat.x || e.x + e.w >= onPlat.x + onPlat.w){
        e.vx *= -1;
      }
    }

    // ตรวจชนผู้เล่น
    if(player.x < e.x + e.w &&
       player.x + player.w > e.x &&
       player.y < e.y + e.h &&
       player.y + player.h > e.y){
         
         if(player.vy > 0 && player.y + player.h - player.vy <= e.y){ 
           // เหยียบหัวศัตรู
           e.alive = false;
           player.vy = -player.jumpPower/2; // เด้งขึ้น
           player.score += 10; // เพิ่มคะแนน
         } else {
           // โดนศัตรู
           player.hp -= 20;
           player.x = 100;
           player.y = 300;
           player.vy = 0;
           player.distance = 0; // รีเซ็ตระยะทาง
           player.score = 0;    // รีเซ็ตคะแนน
           if(player.hp <= 0){
             player.hp = 0;
             gameOver = true;
           }
         }
    }
  });

  // SPAWN ศัตรูใหม่ (เฉพาะพื้นใหญ่)
  if(Math.random() < 0.01 && groundPlatforms.length > 0){
    let plat = groundPlatforms[Math.floor(Math.random()*groundPlatforms.length)];
    let ySpawn = plat.y - 32; // อยู่บนพื้น
    spawnEnemy(plat.x + Math.random()*(plat.w-32), ySpawn);
  }

  // CAMERA FOLLOW
  camera.x = player.x + player.w/2 - W/2;
  camera.y = player.y + player.h/2 - H/2;
  if(camera.x < 0) camera.x = 0;
  if(camera.y < 0) camera.y = 0;
}

// DRAW
function draw() {
  ctx.clearRect(0,0,W,H);

  // พื้นหลัง
  ctx.fillStyle = "#6da0c9";
  ctx.fillRect(0,0,W,H);

  // แพลตฟอร์ม
  ctx.fillStyle = "#1f2d3d";
  platforms.forEach(p => ctx.fillRect(p.x - camera.x, p.y - camera.y, p.w, p.h));

  // ผู้เล่น
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x - camera.x, player.y - camera.y, player.w, player.h);

  // ศัตรู
  ctx.fillStyle = "#ff4444";
  enemies.forEach(e => {
    if(e.alive) ctx.fillRect(e.x - camera.x, e.y - camera.y, e.w, e.h);
  });

  // HUD: HP, ระยะทาง, คะแนน
  ctx.fillStyle = "red";
  ctx.fillRect(20,20,player.hp*2,20);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(20,20,200,20);

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Distance: " + Math.floor(player.distance), 20, 60);
  ctx.fillText("Score: " + player.score, 20, 90);

  // GAME OVER
  if(gameOver){
    ctx.fillStyle = "black";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", W/2 - 150, H/2);
  }
}

// LOOP
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();






