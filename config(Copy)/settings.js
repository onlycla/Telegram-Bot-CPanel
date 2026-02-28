const fs = require('fs');

global.prefix = '/';

global.namabot = 'CPanel Bot' // nama Bot
global.idowner = '' // Isi userID Kalian
global.apikeyhost = `` // Apikey
global.domain = '', // Isi Subdomain Panel Kalian ( contoh : control.domain.com ) 
global.plta ='', // Application Api
global.pltc ='', // User Api
global.loc = '1', // Lokasi default
global.eggs = '15' // Egg default
global.nests = '5' // Nests Default

global.thumbnailPath = "https://image2url.com/r2/default/gifs/1772214458009-17152def-cd10-4f77-8eec-4963b1d19271.gif"
global.paket = "https://image2url.com/r2/default/gifs/1772214458009-17152def-cd10-4f77-8eec-4963b1d19271.gif"

global.mess = {
    wait: "⏳ Sabar ya... lagi diproses, jangan ditinggal dulu!",
    success: "✅ Mantap! Permintaan kamu berhasil diproses.",
    on: "🟢 Oke! Fitur ini sekarang aktif, silakan gunakan.",
    off: "🔴 Sip! Fitur ini dimatikan sementara.",
    text: "✍️ Ups! Kamu belum kasih teks, coba isi dulu ya.",
    link: "🔗 Hmmm... link-nya mana? Kirim dulu yang valid ya.",
    fitur: "⚠️ Wah, fitur ini lagi error. Sabar dulu atau lapor ke owner ya!",
    seller: "🛒 Eits! Fitur ini khusus buat Seller & Owner aja ya.",
    atmin: "🛡️ Maaf, fitur ini hanya dapat digunakan oleh Admin atau Owner!",
    private: "📩 Fitur ini cuma bisa dipakai di chat pribadi, kirim lewat private dong!",
    owner: "👑 Waduh! Cuma yang punya bot alias owner yang bisa akses ini.",
    admin: "🛑 Fitur ini hanya bisa digunakan oleh admin grup!",
    group: "👥 Fitur ini hanya bisa digunakan dalam grup!"
};