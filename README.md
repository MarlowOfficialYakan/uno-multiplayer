# UNO Multiplayer Online

Game UNO real-time, 2–10 pemain (host memilih maksimalnya), dengan server
otoritatif (anti-cheat) via Socket.IO.

## Struktur

```
uno-multiplayer/
  server/   -> Node.js + Express + Socket.io (deploy ke Render/Railway/Fly.io — BUKAN Vercel)
  client/   -> React + Vite + Tailwind + Framer Motion (deploy ke Vercel)
```

## Tampilan (UI/UX)

Client sekarang pakai tema "meja kasino premium": felt gelap dengan vignette
& partikel ambient, kartu 3D (tilt mengikuti pointer + glow neon sesuai
warna), Wild/+4 bergaya holografik, tangan pemain melengkung seperti kartu
sungguhan, kartu terbang dengan animasi pegas saat dimainkan, dan color
picker melingkar untuk Wild — semua pakai **Tailwind CSS** + **Framer
Motion**, tanpa mengubah logika game/Socket.io sama sekali.

Struktur komponen baru:
```
client/src/
  components/
    cards/PlayingCard.jsx   -> kartu depan (3D tilt, glow, holografik)
    cards/CardBack.jsx      -> kartu belakang (tumpukan lawan & draw pile)
    table/GameTable.jsx     -> orkestrator layar bermain
    table/PlayerHand.jsx    -> tangan pemain, fan arc
    table/OpponentSeat.jsx  -> avatar lawan + turn ring + tumpukan kartu
    table/DiscardPile.jsx / DrawPile.jsx
    table/ColorPicker.jsx   -> pemilih warna radial untuk Wild
    table/UnoCallout.jsx    -> animasi "UNO!" layar penuh
    table/TableBackground.jsx / TurnRing.jsx
  hooks/useSound.js         -> hook SFX (placeholder, tinggal isi path file di /public/sfx/)
  utils/theme.js, cardLabel.js
```

Karena ada dependency baru (`tailwindcss`, `framer-motion`), setelah extract
project ini jalankan `npm install` lagi di folder `client/` sebelum
`npm run dev` / deploy ulang di Vercel (Vercel otomatis `npm install` saat
build, jadi cukup redeploy).

Kenapa server tidak di Vercel? Vercel serverless function tidak cocok untuk
koneksi WebSocket yang harus tetap hidup selama game berlangsung (lihat
penjelasan sebelumnya). Jadi: **frontend di Vercel, server game di Render
(gratis, paling gampang)**.

---

## 1. Deploy server (Render — gratis)

1. Push folder ini ke GitHub.
2. Di Render.com → New → Web Service → pilih repo ini, set **Root Directory**
   ke `server`.
3. Build Command: `npm install`
   Start Command: `npm start`
4. Tambahkan Environment Variable:
   - `ALLOWED_ORIGINS` = `https://NAMA-APP-KAMU.vercel.app` (isi setelah
     deploy frontend; boleh beberapa domain dipisah koma)
5. Deploy. Catat URL-nya, misalnya `https://uno-server.onrender.com`.

> Alternatif: Railway, Fly.io, atau VPS mana pun yang menjalankan Node.js —
> caranya sama: `npm install && npm start`, buka port, set `ALLOWED_ORIGINS`.

## 2. Deploy frontend (Vercel)

1. Di Vercel → New Project → pilih repo ini, set **Root Directory** ke
   `client`.
2. Framework preset: Vite.
3. Tambahkan Environment Variable:
   - `VITE_SERVER_URL` = URL server dari langkah 1, contoh
     `https://uno-server.onrender.com`
4. Deploy.
5. Setelah dapat URL Vercel-nya, balik ke Render dan update
   `ALLOWED_ORIGINS` supaya sesuai domain Vercel kamu, lalu redeploy server.

## 3. Coba lokal dulu (opsional tapi disarankan)

```bash
# terminal 1
cd server
npm install
npm start        # jalan di http://localhost:3001

# terminal 2
cd client
npm install
npm run dev       # jalan di http://localhost:5173
```

---

## Cara main

1. Buka website, isi nama, klik **Buat Room**, pilih maksimal pemain (2–10).
2. Bagikan **kode room** ke teman-teman.
3. Mereka isi nama + kode room, klik **Gabung**.
4. Host klik **Mulai Game** kalau sudah minimal 2 pemain.
5. Aturan UNO standar: cocokkan warna/angka, kartu Skip/Reverse/+2/Wild/+4
   berlaku normal, kartu terakhir wajib klik **Panggil UNO!** atau pemain
   lain bisa **Tangkap** kamu (+2 kartu hukuman).

---

## Keamanan yang sudah diterapkan

- **Server otoritatif** — kartu di tangan pemain, urutan draw pile, dan
  validasi setiap langkah (`game.js`) 100% dihitung di server. Client cuma
  mengirim *aksi* ("mainkan kartu X"), tidak pernah mengirim hasil.
- **Hand pribadi** — tiap pemain hanya menerima kartunya sendiri
  (`your_hand` dikirim per-socket). Pemain lain cuma lihat jumlah kartu.
- **Validasi giliran & aturan** — server menolak aksi di luar giliran, kartu
  yang tidak dimiliki, atau langkah yang melanggar aturan UNO
  (`_assertTurn`, `_isValidPlay`).
- **Rate limiting** — token-bucket per koneksi (`index.js`) mencegah
  spam/flood event yang bisa membebani server.
- **CORS ketat** — hanya origin di `ALLOWED_ORIGINS` yang boleh connect;
  set ini ke domain Vercel kamu saja.
- **WSS otomatis** — Render/Vercel keduanya HTTPS by default, jadi koneksi
  WebSocket terenkripsi (WSS) tanpa konfigurasi tambahan.
- **Sanitasi input** — nama pemain & kode room dibatasi panjang dan
  dibersihkan dari karakter berbahaya sebelum dipakai/ditampilkan.
- **Reconnect aman** — kalau pemain disconnect di tengah game, kartunya
  dilebur kembali ke draw pile, bukan hilang atau bisa diklaim ulang.

### Yang belum ada (kalau mau lebih production-ready)
- Autentikasi akun (saat ini identitas = `clientId` acak per-browser,
  siapapun bisa masuk hanya dengan tahu kode room — cukup untuk main
  santai dengan teman).
- Persistensi (kalau server restart, semua room hilang — state disimpan
  di memori, bukan database).

## Reconnect (auto rejoin)

Setiap browser punya `clientId` permanen (UUID) yang disimpan di
`localStorage`, terpisah dari `socket.id` yang berubah tiap konek ulang.
Saat kamu buat/gabung room, `{roomCode, clientId}` disimpan di
`localStorage`. Kalau koneksi putus atau halaman di-refresh, client otomatis
kirim `rejoin_room` begitu tersambung lagi.

- **Di lobby**: kalau kamu disconnect, kursimu langsung dilepas (biar host
  lain nggak nunggu orang yang benar-benar keluar).
- **Saat main**: kursi & kartumu **ditahan 90 detik** (`RECONNECT_GRACE_MS`
  di `rooms.js`). Kalau kamu balik dalam waktu itu (refresh / wifi putus
  sebentar), kamu lanjut dengan tangan yang sama persis. Kalau lewat 90
  detik, kartumu dilebur ke draw pile dan kamu dikeluarkan dari game.
- Klik **"Keluar Room"** untuk sengaja keluar (menghapus sesi tersimpan).

## Chat in-game

Ada panel chat sederhana di lobby & saat bermain (`chat_message` event),
dibatasi panjang pesan (200 karakter) dan pakai rate limiter yang sama
dengan aksi game lain — jadi nggak bisa dipakai buat flood/spam server.
