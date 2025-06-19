# WhatsApp Request Bot

Bot WhatsApp yang bisa mengirim pesan berulang otomatis dengan fitur request/repeat message.

## 🚀 Fitur

- **Request dengan jumlah tertentu**: `.req buku tulis 5`
- **Request infinity**: `.req pensil infinity`
- **Stop request**: `.stopreq`
- **Status check**: `.status`
- **Menu bantuan**: `.help`

## 📋 Persyaratan

- Node.js versi 14 atau lebih baru
- WhatsApp yang bisa di-scan QR code
- Koneksi internet stabil

## 🔧 Cara Install

### 1. Clone atau Download

```bash
# Clone repository ini atau download file bot.js dan package.json
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Bot

```bash
npm start
```

### 4. Scan QR Code

- Buka WhatsApp di HP
- Pilih "Linked Devices"  
- Scan QR code yang muncul di terminal

## 📱 Cara Pakai

### Command Dasar

```
.req [nama item] [jumlah]     - Request dengan jumlah tertentu
.req [nama item] infinity     - Request tanpa batas
.stopreq                      - Stop request yang sedang jalan
.status                       - Cek status request
.help                         - Lihat menu bantuan
```

### Contoh Penggunaan

```
.req buku tulis 4
→ Bot akan kirim "📝 Request 1/4: buku tulis" sampai 4 kali

.req pensil infinity  
→ Bot akan kirim "📝 Request: pensil" terus menerus

.stopreq
→ Menghentikan request yang sedang berjalan
```

## ⚙️ Konfigurasi

### Mengubah Interval Waktu

Edit file `bot.js` di bagian:

```javascript
}, 2000); // Kirim setiap 2 detik
```

Ubah `2000` ke nilai yang diinginkan (dalam milliseconds):
- 1000 = 1 detik
- 3000 = 3 detik
- 5000 = 5 detik

### Mengubah Format Pesan

Edit bagian:

```javascript
await client.sendMessage(chatId, `📝 Request: ${itemName}`);
```

Ubah format pesan sesuai keinginan.

## 🛠️ Troubleshooting

### Error "Module not found"
```bash
npm install
```

### QR Code tidak muncul
- Pastikan terminal/console mendukung QR code
- Atau lihat di file .wwebjs_auth untuk login manual

### Bot tidak respon
- Cek koneksi internet
- Restart bot: Ctrl+C lalu `npm start`

### Session expired  
- Hapus folder `.wwebjs_auth`
- Jalankan ulang bot dan scan QR code baru

## 📝 Catatan Penting

- Hanya bisa 1 request aktif per chat
- Request baru akan menggantikan request lama
- Gunakan dengan bijak, jangan spam berlebihan
- Bot akan berhenti jika WhatsApp terputus

## 🔒 Keamanan

- Jangan share QR code dengan orang lain
- Jaga file session (folder .wwebjs_auth)
- Gunakan di grup/chat yang tepat

## 📞 Support

Jika ada masalah atau butuh bantuan, silakan:
- Cek dokumentasi whatsapp-web.js
- Pastikan Node.js dan dependencies ter-update
- Restart bot jika ada error

---

**Selamat menggunakan WhatsApp Request Bot! 🤖**