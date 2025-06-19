const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

const activeRequests = new Map();

client.on('qr', (qr) => {
    console.log('Scan QR Code di bawah ini (hanya untuk pertama kali):');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot WhatsApp siap digunakan!');
});

// Heartbeat untuk mencegah Railway auto-shutdown
setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Bot masih aktif...`);
}, 60000); // 1 menit

client.on('message', async (message) => {
    const body = message.body.toLowerCase();
    const chatId = message.from;

    if (body.startsWith('.req ')) {
        const args = message.body.split(' ');

        if (args.length < 3) {
            await message.reply('❌ Format salah!\n\nContoh:\n.req buku tulis 5\n.req pensil infinity');
            return;
        }

        const itemName = args.slice(1, -1).join(' ');
        const count = args[args.length - 1];

        if (activeRequests.has(chatId)) {
            clearInterval(activeRequests.get(chatId).interval);
            activeRequests.delete(chatId);
        }

        if (count.toLowerCase() === 'infinity') {
            await message.reply(`🔄 Memulai request infinity untuk: *${itemName}*\n\nKetik *.stopreq* untuk menghentikan`);

            const interval = setInterval(async () => {
                try {
                    await client.sendMessage(chatId, `📝 Request: ${itemName}`);
                } catch (error) {
                    console.log('Error sending message:', error);
                }
            }, 400);

            activeRequests.set(chatId, {
                interval,
                itemName,
                type: 'infinity'
            });

        } else if (!isNaN(count) && parseInt(count) > 0) {
            const totalCount = parseInt(count);
            let currentCount = 0;

            await message.reply(`🔄 Memulai request ${totalCount}x untuk: *${itemName}*`);

            const interval = setInterval(async () => {
                try {
                    currentCount++;
                    await client.sendMessage(chatId, `📝 Request ${currentCount}/${totalCount}: ${itemName}`);

                    activeRequests.set(chatId, {
                        interval,
                        itemName,
                        type: 'counted',
                        total: totalCount,
                        current: currentCount
                    });

                    if (currentCount >= totalCount) {
                        clearInterval(interval);
                        activeRequests.delete(chatId);
                        await client.sendMessage(chatId, `✅ Request selesai! Total: ${totalCount}x ${itemName}`);
                    }
                } catch (error) {
                    console.log('Error sending message:', error);
                }
            }, 400);

        } else {
            await message.reply('❌ Jumlah tidak valid!\n\nGunakan angka atau "infinity"');
        }
    }

    else if (body === '.stopreq') {
        if (activeRequests.has(chatId)) {
            const request = activeRequests.get(chatId);
            clearInterval(request.interval);
            activeRequests.delete(chatId);
            await message.reply(`⏹️ Request untuk *${request.itemName}* telah dihentikan`);
        } else {
            await message.reply('❌ Tidak ada request yang sedang berjalan');
        }
    }

    else if (body === '.status') {
        if (activeRequests.has(chatId)) {
            const request = activeRequests.get(chatId);

            if (request.type === 'infinity') {
                await message.reply(`🔄 *Status Request*\n\nItem: ${request.itemName}\nTipe: Infinity\nStatus: Sedang berjalan\n\nKetik .stopreq untuk menghentikan`);
            } else {
                await message.reply(`🔄 *Status Request*\n\nItem: ${request.itemName}\nProgress: ${request.current}/${request.total}\nStatus: Sedang berjalan\n\nKetik .stopreq untuk menghentikan`);
            }
        } else {
            await message.reply('❌ Tidak ada request yang sedang berjalan');
        }
    }

    else if (body === '.help' || body === '.menu') {
        const helpText = `🤖 *WhatsApp Request Bot*

📋 *Perintah yang tersedia:*

1️⃣ *.req [nama item] [jumlah]*
   Memulai request dengan jumlah tertentu
   Contoh: .req buku tulis 5

2️⃣ *.req [nama item] infinity*
   Memulai request tanpa batas
   Contoh: .req pensil infinity

3️⃣ *.stopreq*
   Menghentikan request yang sedang berjalan

4️⃣ *.status*
   Cek status request yang sedang berjalan

5️⃣ *.help*
   Menampilkan menu bantuan ini

⚡ *Catatan:*
- Setiap pesan dikirim setiap 0.4 detik
- Hanya bisa 1 request aktif per chat
- Request baru akan menggantikan request lama`;

        await message.reply(helpText);
    }
});

// Cleanup saat bot dimatikan
process.on('SIGINT', () => {
    console.log('Membersihkan request yang aktif...');
    activeRequests.forEach((request) => {
        clearInterval(request.interval);
    });
    activeRequests.clear();
    process.exit();
});

// Auto-restart jika disconnect
client.on('disconnected', (reason) => {
    console.log('❌ Bot terputus:', reason);
    process.exit(); // Railway akan restart otomatis
});

client.initialize();
