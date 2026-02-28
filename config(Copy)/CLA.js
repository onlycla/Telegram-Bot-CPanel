/*
Ingin buat script custom dengan fitur sesuai keinginan? Bisa banget!
Hubungi kami:
📱 Telegram: @XieTyS
📱 WhatsApp: wa.me/6285878774454

> 🛠️ Setiap jasa pembuatan script kami garansi jika terjadi error atau masalah lainnya selama 15 hari.
*/

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const {
  exec,
  spawn
} = require("child_process");
const qr = require('qr-image');
const Tiktok = require("@tobyg74/tiktok-api-dl");
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const {
  igdl
} = require('btch-downloader');
const {
  Client
} = require('ssh2');
const tiktok2 = require('../src/lib/tiktok');
const genmusic = require('../src/lib/aimusic');
const generateQRAndUpload = require("../src/lib/uploader");
const {
  startWhatsAppSession,
  sessions,
  restoreWhatsAppSessions
} = require("../src/lib/connectwa")
const {
  addResponList1,
  delResponList1,
  isAlreadyResponList1,
  isAlreadyResponList1Group,
  sendResponList1,
  updateResponList1,
  getDataResponList1
} = require('../src/lib/addlist');

async function handleMessage(xy, command, sleep, isOwner, isSeller, reply, owners, seller, sellerPath, q, text, InlineKeyboard, paket, isGroupAdmins, mess, warnDB, saveWarnDB, pendingWarns, InputFile, botToken, CatBox, sender, db_respon_list, generateReadableString) {
  const isRestarted = process.argv.includes("--restarted");
  switch (command) {

    case "hello":
      reply("Hello juga!");
      break;

    case 'cekidtele': {
      const msg = xy.message;
      const replyToMessage = msg?.reply_to_message;

      if (replyToMessage?.forward_from) {
        const forwardedUserId = replyToMessage.forward_from.id;
        return reply(`ID Telegram pengguna yang meneruskan pesan ini adalah: ${forwardedUserId}`);
      } else if (replyToMessage) {
        return reply('🚫 Harap gunakan pesan yang diteruskan dari orang lain untuk mendapatkan ID.');
      } else {
        return reply(`ID Telegram Anda adalah: ${msg.from.id}`);
      }
    }

    case 'addowner': {
      if (!isOwner) return reply(mess.owner);
      if (!text) return reply('📌 Penggunaan yang benar:\n/addowner ID_Telegram\n(ID harus berupa angka).');

      if (owners.includes(text)) {
        return reply(`⚠️ ID Telegram ${text} sudah menjadi Owner.`);
      }

      owners.push(text);
      fs.writeFileSync('./owner.json', JSON.stringify(owners, null, 2));
      return reply(`✅ ID Telegram ${text} telah ditambahkan ke daftar Owner!`);
    }

    case 'delowner': {
      if (!isOwner) return reply(mess.owner);
      if (!text) return reply('📌 Penggunaan:\n/delowner ID_Telegram\nContoh: /delowner 1234567890');

      const index = owners.indexOf(text);
      if (index !== -1) {
        owners.splice(index, 1);
        fs.writeFileSync('./owner.json', JSON.stringify(owners, null, 2));
        return reply(`✅ ID Telegram ${text} telah dihapus dari daftar Owner.`);
      } else {
        return reply(`⚠️ ID Telegram ${text} tidak ditemukan dalam daftar Owner.`);
      }
    }

    case 'listowner': {
      if (!isOwner) return reply(mess.owner);
      if (owners.length === 0) return reply('🚫 Belum ada Owner yang terdaftar.');

      let list = [];
      for (let id of owners) {
        try {
          const user = await xy.api.getChat(id);
          const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
          list.push(`🆔 *ID:* ${id}\n👑 *Nama:* ${name}`);
        } catch (e) {
          list.push(`🆔 *ID:* ${id}\n👑 *Nama:* Tidak ditemukan`);
        }
      }

      const daftar = `📜 *Daftar Owner:*\n\n${list.join('\n\n')}`;
      return reply(daftar, {
        parse_mode: 'Markdown'
      });
    }
    break


    case 'addseller':
      if (!isOwner) return reply(mess.owner);

      if (!text) return reply('Penggunaan: /addseller ID,durasi,waktu');

      const [id, dur, unit] = text.split(',');
      if (!id || !dur || !unit) return reply('Format salah! Contoh: /addseller 123456789,1,jam');

      const ms = {
        menit: 60000,
        jam: 3600000,
        hari: 86400000,
        bulan: 2592000000
      };

      const durasi = parseInt(dur);
      if (isNaN(durasi) || !ms[unit]) return reply('Durasi tidak valid atau waktu tidak dikenali.');

      if (seller.some(s => s.id === id)) return reply(`ID ${id} sudah jadi seller.`);

      seller.push({
        id,
        expiresAt: Date.now() + durasi * ms[unit]
      });
      fs.writeFileSync('./src/database/seller.json', JSON.stringify(seller, null, 2));
      return reply(`ID ${id} ditambahkan selama ${durasi} ${unit}.`);
      break;

    case 'delseller':
      if (!isOwner) return reply(mess.owner);
      if (!text) return reply('Penggunaan: /delseller ID');

      const index = seller.findIndex(s => s.id === text);
      if (index === -1) return reply(`ID ${text} tidak ditemukan.`);

      seller.splice(index, 1);
      fs.writeFileSync('./src/database/seller.json', JSON.stringify(seller, null, 2));
      return reply(`ID ${text} telah dihapus.`);
      break;

    case 'listseller':
      if (!isOwner) return reply(mess.owner);
      if (!seller.length) return reply('Belum ada seller.');

      const list = [];
      for (let s of seller) {
        const sisa = s.expiresAt - Date.now();
        if (sisa <= 0) {
          seller = seller.filter(x => x.id !== s.id);
          fs.writeFileSync('./src/database/seller.json', JSON.stringify(seller, null, 2));
          continue;
        }

        const jam = Math.floor(sisa / 3600000);
        const menit = Math.floor((sisa % 3600000) / 60000);
        const sisaWaktu = jam > 0 ? `${jam} jam ${menit} menit` : `${menit} menit`;

        try {
          const user = await xy.api.getChat(s.id);
          const nama = user.first_name + (user.last_name ? ' ' + user.last_name : '');
          list.push(`🆔 *ID:* ${s.id}\n👤 *Nama:* ${nama}\n⏳ *Waktu Tersisa:* ${sisaWaktu}`);
        } catch {
          list.push(`🆔 *ID:* ${s.id}\n👤 *Nama:* Tidak ditemukan\n⏳ *Waktu Tersisa:* ${sisaWaktu}`);
        }
      }

      return xy.api.sendMessage(xy.message.chat.id, `📜 *Daftar Seller:*\n\n${list.join('\n\n')}`, {
        parse_mode: 'Markdown'
      });
      break;


    case "createadmin": {
      if (!isOwner) return reply(mess.owner);

      let t = text.split(",");
      if (t.length < 3)
        return reply(`*Format salah!*

Penggunaan:
${prefix + command} sendwa/sendtele,nama,nomor_telepon

Contoh:
${prefix + command} sendwa,tes,628123456789`);

      let sendType = t[0].trim(); // Pilihan pengiriman (sendwa atau sendtele)
      let username = t[1].trim(); // Username
      let targetNumber = t[2].replace(/[^0-9]/g, ""); // ID Telegram atau Nomor WhatsApp

      if (!["sendwa", "sendtele"].includes(sendType)) {
        return reply("Pilihan pengiriman hanya boleh 'sendwa' atau 'sendtele'.");
      }

      let password = Math.random().toString(36).slice(-8); // Password acak
      let email = username + "@xpanel.id";

      let f = await fetch(`${global.domain}/api/application/users`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${global.plta}`
        },
        body: JSON.stringify({
          email: email,
          username: username,
          first_name: username,
          last_name: username,
          language: "en",
          root_admin: true,
          password: password.toString()
        })
      });

      let data = await f.json();
      if (data.errors) {
        return reply(`❌ Error: ${JSON.stringify(data.errors[0], null, 2)}`);
      }
      let user = data.attributes;

      let messageToTarget = `
✓ Admin Panel Berhasil Dibuat

- 𝗜𝗗: ${user.id}
- 𝗘𝗠𝗔𝗜𝗟: ${user.email}
- 𝗨𝗦𝗘𝗥𝗡𝗔𝗠𝗘: ${user.username}
- 𝗣𝗔𝗦𝗦𝗪𝗢𝗥𝗗: ${password.toString()}
- 𝗟𝗢𝗚𝗜𝗡: ${global.domain}

⚠️ Simpan informasi ini, kami hanya mengirimkan detail akun sekali.
`;

            if (sendType === "sendtele") {
        await xy.api.sendMessage(targetNumber, messageToTarget);
      } else if (sendType === "sendwa") {
        const sessionNumber = Array.from(sessions.keys())[0];
        const waClient = sessions.get(sessionNumber);
        if (!waClient) return reply(`Sesi WhatsApp ${sessionNumber} tidak ditemukan.`);
        if (!sessions.has(sessionNumber)) return reply(`WhatsApp ${sessionNumber} belum terhubung.`);
        const custwa = targetNumber.includes("@") ? targetNumber : `${targetNumber}@s.whatsapp.net`;
        try {
          await waClient.sendMessage(custwa, {
            text: messageToTarget
          });
          reply(`✅ Detail panel telah dikirim ke WhatsApp ${targetNumber}`);
        } catch (error) {
          console.error("Gagal mengirim pesan ke WhatsApp:", error);
          reply(`❌ Gagal mengirim pesan ke WhatsApp ${targetNumber}`);
        }
      }
         

      let messageToSender = `✅ Admin *${username}* berhasil dibuat dan data telah dikirim ke *${sendType === "sendtele" ? "Telegram" : "WhatsApp"}* ${targetNumber}.`;
      await xy.api.sendMessage(xy.message.chat.id, {
        text: messageToSender
      });
    }
    break;

    case "1gb":
    case "2gb":
    case "3gb":
    case "4gb":
    case "5gb":
    case "6gb":
    case "7gb":
    case "8gb":
    case "9gb":
    case "10gb":
    case "unli": {
      if (!isOwner && !isSeller) return reply(mess.seller);

      let ram, disk, cpu;
      const userInput = text;

      switch (command) {
        case "1gb":
          ram = "1024";
          disk = "1024";
          cpu = "40";
          break;
        case "2gb":
          ram = "2048";
          disk = "2048";
          cpu = "60";
          break;
        case "3gb":
          ram = "3072";
          disk = "3072";
          cpu = "80";
          break;
        case "4gb":
          ram = "4096";
          disk = "4096";
          cpu = "100";
          break;
        case "5gb":
          ram = "5120";
          disk = "5120";
          cpu = "120";
          break;
        case "6gb":
          ram = "6144";
          disk = "6144";
          cpu = "140";
          break;
        case "7gb":
          ram = "7168";
          disk = "7168";
          cpu = "160";
          break;
        case "8gb":
          ram = "8192";
          disk = "8192";
          cpu = "180";
          break;
        case "9gb":
          ram = "9216";
          disk = "9216";
          cpu = "200";
          break;
        case "10gb":
          ram = "10240";
          disk = "10240";
          cpu = "220";
          break;
        case "unli":
          ram = "0";
          disk = "0";
          cpu = "0";
          break;
      }

      let t = userInput.split(",");
      if (t.length < 3) {
        return reply(`*Format salah!*\n\nPenggunaan:\n/${command} sendwa/sendtele,username,nowa/idtele\n\nContoh:\n/${command} sendwa,tesss,628123456789`);
      }

      let sendType = t[0].trim();
      let username = t[1].trim();
      let targetNumber = t[2].trim();

      if (!["sendwa", "sendtele"].includes(sendType)) {
        return reply("Pilihan pengiriman hanya boleh 'sendwa' atau 'sendtele'.");
      }

      if (!targetNumber.match(/^\d+$/)) {
        return reply(`ID tele / No. WA tujuan tidak valid.`);
      }

      let email = `${username}@xpanel.id`;

      let fCheckEmail = await fetch(`${global.domain}/api/application/users/email/${email}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${global.plta}`
        }
      });

      let checkEmailData = await fCheckEmail.json();
      if (
        checkEmailData.code === "ValidationException" ||
        (checkEmailData.errors && checkEmailData.errors.length > 0)
      ) {
        const source = checkEmailData.meta?.source_field || checkEmailData.errors[0]?.meta?.source_field;
        if (source === "email" || source === "username") {
          return reply(`*${source.toUpperCase()}* sudah digunakan! Silakan pilih yang lain.`);
        }
      }

      let password = Math.random().toString(36).slice(-8);

      let f = await fetch(`${global.domain}/api/application/users`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${global.plta}`
        },
        body: JSON.stringify({
          email: email,
          username: username,
          first_name: username,
          last_name: username,
          language: "en",
          password: password.toString()
        })
      });

      let data = await f.json();
      if (data.errors) {
        return xy.api.sendMessage(xy.message.chat.id, JSON.stringify(data.errors[0], null, 2));
      }

      let user = data.attributes;

      let f2 = await fetch(`${global.domain}/api/application/nests/${nests}/eggs/${global.eggs}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${global.pltc}`
        }
      });

      let data2 = await f2.json();
      let startup_cmd = data2.attributes.startup;

      let f3 = await fetch(`${global.domain}/api/application/servers`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${global.pltc}`
        },
        body: JSON.stringify({
          name: username,
          description: "panel pterodactyl",
          user: user.id,
          egg: parseInt(global.eggs),
          docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
          startup: startup_cmd,
          environment: {
            INST: "npm",
            USER_UPLOAD: "0",
            AUTO_UPDATE: "0",
            CMD_RUN: "npm start"
          },
          limits: {
            memory: ram,
            swap: 0,
            disk: disk,
            io: 500,
            cpu: cpu
          },
          feature_limits: {
            databases: 5,
            backups: 5,
            allocations: 5
          },
          deploy: {
            locations: [parseInt(global.loc)],
            dedicated_ip: false,
            port_range: []
          }
        })
      });

      let res = await f3.json();
      if (res.errors) {
        return xy.api.sendMessage(xy.message.chat.id, JSON.stringify(res.errors[0], null, 2));
      }

      let server = res.attributes;

      let messageToSend = `
🎉 *Panel Berhasil Dibuat!*

🔹 *Detail Panel Anda:*
────────────────────
- 𝗜𝗗: ${user.id}
- 𝗘𝗠𝗔𝗜𝗟: ${user.email}
- 𝗨𝗦𝗘𝗥𝗡𝗔𝗠𝗘: ${user.username}
- 𝗣𝗔𝗦𝗦𝗪𝗢𝗥𝗗: ${password.toString()}
- 𝗟𝗢𝗚𝗜𝗡: [Klik untuk login](${global.domain})

⚠️ 𝗣𝗘𝗥𝗛𝗔𝗧𝗜𝗔𝗡:
────────────────────
Simpan informasi ini dengan baik, karena kami hanya mengirimkan detail akun sekali. Jika hilang, Anda bertanggung jawab atas data ini.
`;

      if (sendType === "sendtele") {
        await xy.api.sendMessage(targetNumber, messageToSend);
      } else if (sendType === "sendwa") {
        const sessionNumber = Array.from(sessions.keys())[0];
        const waClient = sessions.get(sessionNumber);
        if (!waClient) return reply(`Sesi WhatsApp ${sessionNumber} tidak ditemukan.`);
        if (!sessions.has(sessionNumber)) return reply(`WhatsApp ${sessionNumber} belum terhubung.`);
        const custwa = targetNumber.includes("@") ? targetNumber : `${targetNumber}@s.whatsapp.net`;
        try {
          await waClient.sendMessage(custwa, {
            text: messageToSend
          });
          reply(`✅ Detail panel telah dikirim ke WhatsApp ${targetNumber}`);
        } catch (error) {
          console.error("Gagal mengirim pesan ke WhatsApp:", error);
          reply(`❌ Gagal mengirim pesan ke WhatsApp ${targetNumber}`);
        }
      }

      let messageToSender = `✅ Panel untuk username *${username}* telah berhasil dibuat dan data telah dikirim ke *${sendType === "sendtele" ? "Telegram" : "WhatsApp"}* ${targetNumber}.`;
      await xy.api.sendMessage(xy.message.chat.id, messageToSender);
    };
    break;

    case 'welcome': {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      const groupID = xy.message.chat.id;
      const input = text // Pastikan `text[0]` ada
      const status = input === "on" ? true : input === "off" ? false : null;
      if (status === null) return reply("⚠️ Gunakan 'on' atau 'off'. Contoh: /welcome on");

      let listData = [];
      try {
        listData = JSON.parse(fs.readFileSync('./src/database/weleave.json', 'utf8'));
      } catch (error) {
        console.error("Gagal membaca database, membuat baru...");
      }

      const groupIndex = listData.findIndex(item => item.id === groupID);
      if (groupIndex !== -1) {
        listData[groupIndex].welcome = status;
      } else {
        listData.push({
          id: groupID,
          welcome: status,
          leave: false
        });
      }

      fs.writeFileSync('./src/database/weleave.json', JSON.stringify(listData, null, 2));

      reply(`✅ Fitur *Welcome* telah ${status ? "diaktifkan ✅" : "dinonaktifkan ❌"}.`);
      break;
    }

    case 'leave': {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      const groupID = xy.message.chat.id;
      const input = text;

      const status = input === "on" ? true : input === "off" ? false : null;
      if (status === null) return reply("⚠️ Gunakan 'on' atau 'off'. Contoh: /leave on");

      let listData = [];
      try {
        listData = JSON.parse(fs.readFileSync('./src/database/weleave.json', 'utf8'));
      } catch (error) {
        console.error("Gagal membaca database, membuat baru...");
      }

      const groupIndex = listData.findIndex(item => item.id === groupID);
      if (groupIndex !== -1) {
        listData[groupIndex].leave = status;
      } else {
        listData.push({
          id: groupID,
          welcome: false,
          leave: status
        });
      }

      fs.writeFileSync('./src/database/weleave.json', JSON.stringify(listData, null, 2));

      reply(`✅ Fitur *Leave* telah ${status ? "diaktifkan ✅" : "dinonaktifkan ❌"}.`);
      break;
    }

    case 'antilink': {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      const groupID = xy.message.chat.id;
      const input = text; // Pastikan hanya membaca argumen pertama

      if (input !== "on" && input !== "off") {
        return reply("⚠️ Gunakan 'on' atau 'off'. Contoh: /antilink on");
      }

      const status = input === "on"; // Jika "on" maka true, jika "off" maka false

      let listData = [];
      try {
        listData = JSON.parse(fs.readFileSync('./src/database/antilink.json', 'utf8'));
      } catch (error) {
        console.error("Gagal membaca database, membuat baru...");
      }

      const groupIndex = listData.findIndex(item => item.id === groupID);
      if (groupIndex !== -1) {
        listData[groupIndex].antilink = status;
      } else {
        listData.push({
          id: groupID,
          antilink: status
        });
      }

      fs.writeFileSync('./src/database/antilink.json', JSON.stringify(listData, null, 2));

      reply(`✅ Fitur *Anti-Link* telah ${status ? "diaktifkan ✅" : "dinonaktifkan ❌"}.`);
      break;
    }

    case "kick": {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      if (!xy.message.reply_to_message) return reply("⚠️ Balas pesan pengguna yang ingin dikick.");

      const userId = xy.message.reply_to_message.from.id;

      try {
        const member = await xy.api.getChatMember(xy.message.chat.id, userId);
        if (member.status === "administrator" || member.status === "creator") {
          return reply("⚠️ Tidak bisa menendang admin atau pemilik grup.");
        }

        await xy.api.banChatMember(xy.message.chat.id, userId);
        await xy.api.unbanChatMember(xy.message.chat.id, userId); // Agar bisa join lagi setelah dikick

        reply(`✅ Berhasil mengeluarkan pengguna.`);
      } catch (error) {
        console.error("❌ Gagal mengeluarkan pengguna:", error);
        reply("⚠️ Gagal mengeluarkan pengguna. Pastikan bot memiliki izin untuk mengeluarkan anggota.");
      }
      break;
    }

    case "add": {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      if (text.length === 0) return reply("⚠️ Masukkan ID pengguna yang ingin ditambahkan.\nContoh: /add 123456789");

      const userId = text[0];

      try {
        const chatInviteLink = await xy.api.createChatInviteLink(xy.message.chat.id, {
          expire_date: Math.floor(Date.now() / 1000) + 3600, // Link berlaku 1 jam
          member_limit: 1, // Batas 1 pengguna
        });

        await xy.api.sendMessage(text, `✅ Anda telah diundang ke grup. Klik link berikut untuk bergabung:\n${chatInviteLink.invite_link}`);
        reply(`✅ Link undangan telah dikirim ke pengguna.`);
      } catch (error) {
        console.error("❌ Gagal mengirim link undangan:", error);
        reply("⚠️ Gagal mengirim link undangan. Pastikan ID pengguna benar dan bot dapat mengirim pesan ke mereka.");
      }
      break;
    }

    case "close": {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      try {
        await xy.api.setChatPermissions(xy.message.chat.id, {
          can_send_messages: false,
          can_send_media_messages: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        });

        reply("✅ Grup telah *ditutup*. Hanya admin yang dapat mengirim pesan.");
      } catch (error) {
        console.error("❌ Gagal menutup grup:", error);
        reply("⚠️ Gagal menutup grup. Pastikan bot memiliki izin untuk mengubah pengaturan grup.");
      }
      break;
    }

    case "open": {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      try {
        await xy.api.setChatPermissions(xy.message.chat.id, {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        });

        reply("✅ Grup telah *dibuka*. Semua anggota dapat mengirim pesan.");
      } catch (error) {
        console.error("❌ Gagal membuka grup:", error);
        reply("⚠️ Gagal membuka grup. Pastikan bot memiliki izin untuk mengubah pengaturan grup.");
      }
      break;
    }

    case "changetitle": {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);
      if (!text.length) return reply("⚠️ Harap masukkan nama grup baru.\nContoh: /changetitle NamaBaru");

      const newTitle = text;

      try {
        await xy.api.setChatTitle(xy.message.chat.id, newTitle);
        reply(`✅ Nama grup berhasil diubah menjadi: *${newTitle}*`);
      } catch (error) {
        console.error("❌ Gagal mengubah nama grup:", error);
        reply("⚠️ Gagal mengubah nama grup. Pastikan bot memiliki izin.");
      }
      break;
    }

    case "changedesk": {
      if (!xy.message.chat || !xy.message.chat.id) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);
      if (!text.length) return reply("⚠️ Harap masukkan deskripsi baru.\nContoh: /changedesk DeskripsiBaru");

      const newDescription = text;

      try {
        await xy.api.setChatDescription(xy.message.chat.id, newDescription);
        reply("✅ Deskripsi grup berhasil diubah.");
      } catch (error) {
        console.error("❌ Gagal mengubah deskripsi grup:", error);
        reply("⚠️ Gagal mengubah deskripsi grup. Pastikan bot memiliki izin.");
      }
      break;
    }

    case "changeppgc":
      if (!xy.chat.type.includes("group")) return reply("❌ Perintah ini hanya bisa digunakan di grup.");
      if (!isGroupAdmins && !isOwner) return reply("❌ Kamu harus admin untuk mengganti foto grup.");
      if (!xy.message.reply_to_message?.photo) return reply("❌ Balas foto dengan perintah ini untuk mengubah foto profil grup.");

      try {
        const chatId = xy.chat.id;

        const botMember = await xy.api.getChatMember(chatId, xy.me.id);
        if (!["administrator", "creator"].includes(botMember.status)) {
          return reply("❌ Bot harus menjadi admin untuk mengubah foto profil grup.");
        }

        const userMember = await xy.api.getChatMember(chatId, xy.from.id);
        if (!["administrator", "creator"].includes(userMember.status)) {
          return reply("❌ Kamu harus menjadi admin untuk mengganti foto grup.");
        }

        const fileId = xy.message.reply_to_message.photo.at(-1).file_id;

        const file = await xy.api.getFile(fileId);
        if (!file?.file_path) return reply("❌ Gagal mendapatkan file gambar.");

        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;

        const fileBuffer = await axios.get(fileUrl, {
          responseType: 'arraybuffer'
        });

        const inputFile = new InputFile(fileBuffer.data, 'image.jpg');

        await xy.api.setChatPhoto(chatId, {
          source: inputFile
        });

        reply("✅ Foto profil grup berhasil diubah!");
      } catch (error) {
        console.error("❌ Gagal mengubah foto profil grup:", error.message || error);
        reply("❌ Terjadi kesalahan saat mengubah foto profil grup.");
      }
      break;

    case "promote":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);
      if (!xy.message.reply_to_message) return reply("⚠️ Balas pesan pengguna yang ingin dipromosikan menjadi admin.");

      let userToPromote = xy.message.reply_to_message.from.id;
      try {
        await xy.api.promoteChatMember(xy.chat.id, userToPromote, {
          can_change_info: false,
          can_delete_messages: true,
          can_invite_users: true,
          can_restrict_members: true,
          can_pin_messages: true,
          can_manage_chat: true
        });
        reply(`✅ @${xy.message.reply_to_message.from.username || xy.message.reply_to_message.from.first_name} telah dipromosikan menjadi admin.`);
      } catch (error) {
        console.error("❌ Gagal mempromosikan pengguna:", error);
        reply("❌ Terjadi kesalahan saat mempromosikan pengguna.");
      }
      break;

    case "demote":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);
      if (!xy.message.reply_to_message) return reply("⚠️ Balas pesan pengguna yang ingin dicabut adminnya.");

      let userToDemote = xy.message.reply_to_message.from.id;
      try {
        await xy.api.promoteChatMember(xy.chat.id, userToDemote, {
          can_change_info: false,
          can_delete_messages: false,
          can_invite_users: false,
          can_restrict_members: false,
          can_pin_messages: false,
          can_manage_chat: false
        });
        reply(`✅ @${xy.message.reply_to_message.from.username || xy.message.reply_to_message.from.first_name} telah dicabut status adminnya.`);
      } catch (error) {
        console.error("❌ Gagal mencabut status admin pengguna:", error);
        reply("❌ Terjadi kesalahan saat mencabut status admin pengguna.");
      }
      break;

    case "delete":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);
      if (!xy.message.reply_to_message) return reply("⚠️ Balas pesan yang ingin dihapus dengan perintah `/delete`.");

      try {
        await xy.api.deleteMessage(xy.chat.id, xy.message.reply_to_message.message_id);
        reply("✅ Pesan berhasil dihapus.", {
          reply_to_message_id: xy.message.message_id
        });
      } catch (error) {
        console.error("❌ Gagal menghapus pesan:", error);
        reply("❌ Terjadi kesalahan saat menghapus pesan.");
      }
      break;

    case "pin":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);
      if (!xy.message.reply_to_message) return reply("⚠️ Balas pesan yang ingin disematkan dengan perintah `/pin`.");

      try {
        await xy.api.pinChatMessage(xy.chat.id, xy.message.reply_to_message.message_id);
        reply("📌 Pesan berhasil disematkan.", {
          reply_to_message_id: xy.message.message_id
        });
      } catch (error) {
        console.error("❌ Gagal menyematkan pesan:", error);
        reply("❌ Terjadi kesalahan saat menyematkan pesan.");
      }
      break;

    case "unpin":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);
      if (!xy.message.reply_to_message) return reply("⚠️ Balas pesan yang ingin dilepas dari sematan dengan perintah `/unpin`.");

      try {
        await xy.api.unpinChatMessage(xy.chat.id, xy.message.reply_to_message.message_id);
        reply("📌 Pesan berhasil dilepas dari sematan.", {
          reply_to_message_id: xy.message.message_id
        });
      } catch (error) {
        console.error("❌ Gagal melepas sematan:", error);
        reply("❌ Terjadi kesalahan saat melepas sematan.");
      }
      break;

    case "createpolling":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);
      if (!text) return reply("⚠️ Masukkan pertanyaan polling dan opsi jawaban.\n\nContoh:\n`/createpolling Apa makanan favorit kalian?, Nasi Goreng, Mie Ayam, Bakso`", {
        parse_mode: "Markdown"
      });

      try {
        let [question, ...options] = text.split(",").map(a => a.trim());

        if (!question || options.length < 2) {
          return reply("⚠️ Format salah! Minimal harus ada 2 opsi jawaban.\n\nContoh:\n`/createpolling Apa makanan favorit kalian?, Nasi Goreng, Mie Ayam, Bakso`", {
            parse_mode: "Markdown"
          });
        }

        await xy.api.sendPoll(xy.chat.id, question, options, {
          is_anonymous: false
        });
        reply("📊 Polling berhasil dibuat!", {
          reply_to_message_id: xy.message.message_id
        });
      } catch (error) {
        console.error("❌ Gagal membuat polling:", error);
        reply("❌ Terjadi kesalahan saat membuat polling.");
      }
      break;

    case "groupstats":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);

      try {
        const chat = await xy.api.getChat(xy.chat.id);
        const memberCount = await xy.api.getChatMembersCount(xy.chat.id);
        const admins = await xy.api.getChatAdministrators(xy.chat.id);

        let message = `📊 *Statistik Grup*\n\n`;
        message += `📌 *Nama Grup:* ${chat.title}\n`;
        message += `🆔 *ID Grup:* ${xy.chat.id}\n`;
        message += `👥 *Total Anggota:* ${memberCount}\n`;
        message += `👮‍♂️ *Total Admin:* ${admins.length}\n`;

        reply(message, {
          parse_mode: "Markdown"
        });

      } catch (error) {
        console.error("❌ Gagal mengambil statistik grup:", error);
        reply("❌ Terjadi kesalahan saat mengambil statistik grup.");
      }
      break;

    case "linkgroup":
      if (!["group", "supergroup"].includes(xy.chat.type)) return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      try {
        const inviteLink = await xy.api.exportChatInviteLink(xy.chat.id);
        reply(`🔗 *Link Undangan Grup:*\n${inviteLink}`);

      } catch (error) {
        console.error("❌ Gagal mendapatkan link grup:", error);
        reply("❌ Terjadi kesalahan saat mengambil link grup. Pastikan bot adalah admin dan memiliki izin mengundang anggota.");
      }
      break;

    case "warn":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);

      let targetUser = xy.message.reply_to_message?.from;
      if (!targetUser) return reply("⚠️ Balas pesan anggota yang ingin diberi peringatan.");

      let userId = targetUser.id;
      let reason = text || "Tanpa alasan";

      if (!warnDB[userId]) warnDB[userId] = [];

      warnDB[userId].push(reason);
      saveWarnDB(warnDB);

      let warnCount = warnDB[userId].length;
      let warnMsg = `⚠️ ${targetUser.first_name} telah diperingatkan!\n🔹 Alasan: ${reason}\n📌 Total peringatan: ${warnCount}/3`;

      let sentMessage = await xy.api.sendMessage(xy.chat.id, warnMsg, {
        reply_markup: {
          inline_keyboard: [
            [{
              text: "❌ Batalkan Peringatan",
              callback_data: `cancel_warn_${userId}`
            }]
          ]
        }
      });

      pendingWarns.set(userId, sentMessage.message_id);

      if (xy.message.reply_to_message) {
        await xy.api.deleteMessage(xy.chat.id, xy.message.reply_to_message.message_id);
      }

      if (warnCount >= 3) {
        await xy.api.kickChatMember(xy.chat.id, userId);
        delete warnDB[userId];
        saveWarnDB(warnDB);
        await xy.api.sendMessage(xy.chat.id, `🚨 ${targetUser.first_name} telah dikeluarkan karena mencapai batas peringatan.`);
      }
      break;

    case "warns":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);

      let target = xy.message.reply_to_message?.from;
      if (!target) return reply("⚠️ Balas pesan anggota untuk melihat peringatannya.");

      let warns = warnDB[target.id] || [];
      if (warns.length === 0) return reply(`✅ <b>${target.first_name}</b> belum memiliki peringatan.`, {
        parse_mode: "HTML"
      });

      let warnList = warns.map((r, i) => `${i + 1}. ${r}`).join("\n");
      reply(`⚠️ Peringatan untuk <b>${target.first_name}</b>:\n\n${warnList}`, {
        parse_mode: "HTML"
      });
      break;

    case "resetwarn":
      if (!xy.chat.type.includes("group")) return reply(global.mess.group);
      if (!isGroupAdmins && !isOwner) return reply(global.mess.admin);

      let resetUser = xy.message.reply_to_message?.from;
      if (!resetUser) return reply("⚠️ Balas pesan anggota untuk menghapus peringatannya.");

      delete warnDB[resetUser.id];
      saveWarnDB(warnDB);
      reply(`✅ Peringatan <b>${resetUser.first_name}</b> telah dihapus.`, {
        parse_mode: "HTML"
      });
      break;

    case 'tourl': {
      if (!xy.message?.reply_to_message || (!xy.message.reply_to_message.photo && !xy.message.reply_to_message.video)) {
        return reply(`📌 *Reply gambar atau video dengan caption* \`${prefix + command}\``, {
          parse_mode: "Markdown"
        });
      }

      const fileId = xy.message.reply_to_message.photo ?
        xy.message.reply_to_message.photo.at(-1).file_id :
        xy.message.reply_to_message.video.file_id;

      try {
        const file = await xy.api.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;

        const filePath = path.join(__dirname, path.basename(file.file_path));
        const response = await axios({
          url: fileUrl,
          responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
          try {
            const uploaded = await CatBox(filePath);
            await reply(`✅ *Berhasil diunggah!*\n🔗 *URL:* ${uploaded}`, {
              parse_mode: "Markdown"
            });
            fs.unlinkSync(filePath);
          } catch (uploadError) {
            console.error(uploadError);
            reply(`❌ Gagal mengunggah file.`);
          }
        });

        writer.on('error', (err) => {
          console.error(err);
          reply(`❌ Gagal menyimpan file dari Telegram.`);
        });

      } catch (err) {
        console.error(err);
        reply(`❌ Gagal mengambil file dari Telegram.`);
      }
    }
    break;

    case "sticker": {
      if (!xy.message.reply_to_message ||
        (!xy.message.reply_to_message.photo && !xy.message.reply_to_message.video)) {
        return reply(`📌 *Reply gambar atau video dengan perintah* \`${prefix + command}\``);
      }

      let fileId, isVideo = false;

      if (xy.message.reply_to_message.photo) {
        fileId = xy.message.reply_to_message.photo.at(-1).file_id;
      } else if (xy.message.reply_to_message.video) {
        fileId = xy.message.reply_to_message.video.file_id;
        isVideo = true;
      }

      try {
        const file = await xy.api.getFile(fileId);
        if (!file.file_path) return reply(`❌ Gagal mengambil file dari Telegram.`);

        const filePath = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
        const inputPath = `./temp_input${isVideo ? ".mp4" : ".jpg"}`;
        const outputPath = `./temp_output.${isVideo ? "webm" : "webp"}`;

        const response = await axios.get(filePath, {
          responseType: "arraybuffer"
        });
        fs.writeFileSync(inputPath, response.data);

        const ffmpegCmd = isVideo ?
          `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease" -c:v libvpx-vp9 -b:v 500k -an "${outputPath}"` :
          `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease" -qscale 50 "${outputPath}"`;

        exec(ffmpegCmd, async (err) => {
          if (err) {
            console.error(err);
            return reply(`❌ Gagal mengonversi ${isVideo ? "video" : "gambar"} ke stiker.`);
          }

          const stickerBuffer = fs.readFileSync(outputPath);
          await xy.api.sendSticker(xy.chat.id, new InputFile(stickerBuffer, outputPath));

          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });

      } catch (err) {
        console.error(err);
        reply(`❌ Terjadi kesalahan.`);
      }
    }
    break;

    case "toimg":
    case "toimage": {
      if (!xy.message.reply_to_message || !xy.message.reply_to_message.sticker) {
        return reply(`📌 *Reply stiker dengan perintah* \`${prefix + command}\``);
      }

      const fileId = xy.message.reply_to_message.sticker.file_id;

      try {
        const file = await xy.api.getFile(fileId);
        if (!file.file_path) return reply("❌ Gagal mengambil file dari Telegram.");

        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
        const inputPath = `./temp_sticker.webp`;
        const outputPath = `./temp_image.png`;

        const response = await axios.get(fileUrl, {
          responseType: "arraybuffer"
        });
        fs.writeFileSync(inputPath, response.data);

        exec(`ffmpeg -i "${inputPath}" "${outputPath}"`, async (err) => {
          fs.unlinkSync(inputPath);
          if (err) {
            console.error(err);
            return reply("❌ Gagal mengonversi stiker ke gambar.");
          }

          const imageBuffer = fs.readFileSync(outputPath);
          await xy.api.sendPhoto(xy.chat.id, new InputFile(imageBuffer, outputPath), {
            caption: "✅ *Berhasil dikonversi ke gambar!*"
          });

          fs.unlinkSync(outputPath);
        });

      } catch (err) {
        console.error(err);
        reply("❌ Terjadi kesalahan saat mengonversi stiker.");
      }
    }
    break;

    case "tovideo": {
      if (!xy.message.reply_to_message || !xy.message.reply_to_message.sticker) {
        return reply(`📌 *Reply stiker dengan perintah* \`${prefix + command}\``);
      }

      const sticker = xy.message.reply_to_message.sticker;
      const fileId = sticker.file_id;
      const ext = sticker.is_video ? ".webm" : ".webp";
      const inputPath = `./sticker${ext}`;
      const outputPath = `./video.mp4`;

      try {
        const file = await xy.api.getFile(fileId);
        if (!file.file_path) return reply("❌ Gagal mengambil file dari Telegram.");

        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
        const response = await axios.get(fileUrl, {
          responseType: "arraybuffer"
        });

        fs.writeFileSync(inputPath, response.data);

        exec(`ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=512:512:force_original_aspect_ratio=decrease" "${outputPath}"`, async (err) => {
          fs.unlinkSync(inputPath);

          if (err) {
            console.error(err);
            return reply("❌ Gagal mengonversi stiker ke video.");
          }

          const videoBuffer = fs.readFileSync(outputPath);
          await xy.api.sendVideo(xy.chat.id, new InputFile(videoBuffer, "video.mp4"), {
            caption: "✅ *Berhasil dikonversi ke video!*"
          });

          fs.unlinkSync(outputPath);
        });

      } catch (err) {
        console.error(err);
        reply("❌ Terjadi kesalahan saat mengonversi stiker.");
      }
    }
    break;

    case 'qc': {
      if (!isOwner) return reply(mess.owner);

      const teks = xy.message.reply_to_message?.text || text;
      if (!teks) return reply("Cara penggunaan: /qc teks (atau reply pesan)");

      const targetUser = xy.message.reply_to_message?.from || xy.from;

      let avatarUrl = "https://i0.wp.com/telegra.ph/file/134ccbbd0dfc434a910ab.png";

      try {
        const photos = await xy.api.getUserProfilePhotos(targetUser.id);
        if (photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          const file = await xy.api.getFile(fileId);
          if (file?.file_path) {
            avatarUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
          }
        }
      } catch (err) {
        console.warn("Tidak bisa ambil foto profil:", err.message);
      }

      const payload = {
        type: "quote",
        format: "png",
        backgroundColor: "#FFFFFF",
        width: 700,
        height: 580,
        scale: 2,
        messages: [{
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: targetUser.first_name,
            photo: {
              url: avatarUrl
            }
          },
          text: teks,
          replyMessage: {}
        }]
      };

      try {
        const {
          data
        } = await axios.post("https://bot.lyo.su/quote/generate", payload, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        const pngBuffer = Buffer.from(data.result.image, "base64");
        const inputPath = './qc_input.png';
        const outputPath = './qc_output.webp';

        fs.writeFileSync(inputPath, pngBuffer);

        exec(`ffmpeg -y -i ${inputPath} -vf "scale=512:-1" -vcodec libwebp -lossless 1 ${outputPath}`, async (err) => {
          if (err) {
            console.error("FFmpeg Error:", err);
            return reply("❌ Gagal membuat QC.");
          }

          const stickerBuffer = fs.readFileSync(outputPath);
          await xy.api.sendSticker(xy.chat.id, new InputFile(stickerBuffer, outputPath));
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });

      } catch (err) {
        console.error("QC Error:", err);
        reply("❌ Gagal membuat QC.");
      }

      break;
    }

    case 'toqr': {
      if (!q) return reply(`*Kirim/balas teks atau URL dengan caption* ${prefix + command}`);

      try {
        const qrFilePath = './qr_code.png';

        const qrOptions = {
          type: 'png',
          size: 10, // ukuran QR (1-40)
          margin: 2, // margin sekitar QR
          ec_level: 'H' // error correction level: L, M, Q, H
        };

        const qrStream = qr.image(q, qrOptions);

        const writeStream = fs.createWriteStream(qrFilePath);
        qrStream.pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
          qrStream.on('error', reject);
        });

        await xy.api.sendPhoto(xy.chat.id, new InputFile(fs.createReadStream(qrFilePath)), {
          caption: '✅ QR code berhasil dibuat!'
        });

        fs.unlinkSync(qrFilePath);

      } catch (err) {
        console.error("QR Error:", err);
        reply("❌ Gagal membuat QR code.");
      }

      break;
    }

    case 'tiktok': {
      if (!text) {
        return reply(`❌ *Format salah!*\n\nContoh penggunaan:\n/tiktok link_video`);
      }

      if (!text.includes('tiktok')) {
        return reply(`❌ *Tautan yang diberikan tidak valid atau tidak didukung.*`);
      }

      await reply(`⏳ *Sedang memproses video TikTok...*`);

      try {
        const data = await tiktok2(text); // ← panggil fungsi kamu

        if (data.no_watermark) {
          const videoBuffer = await axios.get(data.no_watermark, {
            responseType: 'arraybuffer'
          });
          await xy.api.sendVideo(xy.chat.id, new InputFile(Buffer.from(videoBuffer.data), "tiktok.mp4"), {
            caption: `🎥 *Tanpa Watermark*\n${data.title || ''}`,
            parse_mode: "Markdown"
          });
        }

        if (data.music && data.music.startsWith('http')) {
          const audioBuffer = await axios.get(data.music, {
            responseType: 'arraybuffer'
          });
          await xy.api.sendAudio(xy.chat.id, new InputFile(Buffer.from(audioBuffer.data), "audio.mp3"), {
            caption: `🎵 *Audio dari TikTok*`,
            parse_mode: "Markdown"
          });
        }

        await xy.api.sendMessage(xy.chat.id, `✅ *Berhasil mengunduh video TikTok!*`, {
          parse_mode: "Markdown"
        });

      } catch (err) {
        console.error(err);
        reply(`❌ *Terjadi kesalahan saat memproses video TikTok.*`);
      }

      break;
    }

    case 'tiktokslide': {
      if (!text) {
        return reply(`Gunakan perintah ini dengan cara ${prefix + command} *url*\n\n_Contoh_\n\n${prefix + command} https://vt.tiktok.com/ZSYg43AwX/`);
      }

      await reply('⏳ Sedang memproses...');

      try {
        const result = await Tiktok.Downloader(text, {
          version: "v1",
          proxy: null
        });

        if (result.status !== "success") {
          return xy.api.sendMessage(xy.chat.id, {
            text: `❌ Gagal mengunduh TikTok.`
          });
        }

        let i = 1;

        const audioUrl = result.result.music?.playUrl?.[0];
        if (audioUrl) {
          const audioRes = await axios.get(audioUrl, {
            responseType: "arraybuffer"
          });
          await xy.api.sendAudio(xy.chat.id, new InputFile(Buffer.from(audioRes.data), "tiktok_audio.mp3"), {
            caption: '🎵 Audio TikTok'
          });
        }

        if (result.result.type === "image" && result.result.images?.length) {
          const {
            images,
            author,
            description,
            statistics
          } = result.result;
          const urlCreator = author?.url;

          for (const imageUrl of images) {
            const imgRes = await axios.get(imageUrl, {
              responseType: "arraybuffer"
            });
            await xy.api.sendPhoto(xy.chat.id, new InputFile(Buffer.from(imgRes.data), `slide_${i}.jpg`), {
              caption: `📸 Gambar ke-${i++}\n👤 ${author.nickname}\n📝 ${description}`
            });
          }

          await xy.api.sendMessage(xy.chat.id, {
            text: `📊 Statistik:\n👀 Views: ${statistics.playCount}\n🔄 Shares: ${statistics.shareCount}\n💬 Comments: ${statistics.commentCount}\n📥 Downloads: ${statistics.downloadCount}\n👤 Creator: [${author.nickname}](${urlCreator})`,
            parse_mode: "Markdown"
          });
        } else {
          await xy.api.sendMessage(xy.chat.id, {
            text: `⚠️ Konten TikTok yang diberikan tidak berupa audio maupun gambar.`
          });
        }

      } catch (error) {
        console.error(`Error processing TikTok:`, error);
        await xy.api.sendMessage(xy.chat.id, {
          text: `❌ Terjadi kesalahan saat memproses TikTok.`
        });
      }

      break;
    }

    case 'ytdl': {
      if (!text) return reply('❌ *Format salah!*\n\nContoh penggunaan:\n/yt https://www.youtube.com/watch?v=xyz');

      const link = text;
      if (!ytdl.validateURL(link)) return reply('❌ *Link tidak valid!*');

      try {
        await reply('⏳ *Mengunduh video dan audio dari YouTube...*');

        const info = await ytdl.getInfo(link);
        if (!info || !info.videoDetails) return reply('❌ *Gagal mendapatkan info video!*');

        const {
          title,
          author,
          lengthSeconds,
          uploadDate
        } = info.videoDetails;
        const duration = new Date(lengthSeconds * 1000).toISOString().substr(11, 8);
        const durationFormatted = duration.startsWith('00:') ? duration.substr(3) : duration;

        const videoPath = './yt_video.mp4';
        const audioPath = './yt_audio.mp3';

        await new Promise((resolve, reject) => {
          const videoStream = ytdl(link, {
            quality: 'highestvideo'
          });
          const writeStream = fs.createWriteStream(videoPath);
          videoStream.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        await new Promise((resolve, reject) => {
          const audioStream = ytdl(link, {
            quality: 'highestaudio'
          });
          ffmpeg(audioStream)
            .audioCodec('libmp3lame')
            .save(audioPath)
            .on('end', resolve)
            .on('error', reject);
        });

        const audioUrl = await CatBox(audioPath);
        await xy.api.sendAudio(xy.chat.id, audioUrl, {
          caption: '🎵 *Audio YouTube*',
          parse_mode: 'Markdown'
        });

        const videoUrl = await CatBox(videoPath);

        await xy.api.sendVideo(xy.chat.id, new InputFile(videoPath), {
          caption: `🎬 *Video YouTube:*\n\n📌 *Judul:* ${title}\n📺 *Channel:* ${author.name}\n⏳ *Durasi:* ${durationFormatted}\n📅 *Upload:* ${uploadDate || '-'}\n🔗 *Link:* ${link}`,
          parse_mode: 'Markdown'
        });

        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);
        const jsFile = fs.readdirSync('.').find(file => file.endsWith('-player-script.js'));
        if (jsFile) {
          fs.unlinkSync(jsFile);
        }
      } catch (err) {
        console.error('YTDL Error:', err);
        reply('❌ *Gagal mengunduh YouTube!*');
      }
      break;
    }

    case 'ssweb': {
      if (!text) return reply(`❌ *Format salah!*\n\nContoh penggunaan:\n/ssweb https://github.com`);

      const url = text.startsWith('http') ? text : 'https://' + text;
      const screenshotUrl = `https://image.thum.io/get/width/1900/crop/1000/fullpage/${url}`;
      const filename = path.join(__dirname, 'screenshot.jpg');

      try {
        const response = await axios.get(screenshotUrl, {
          responseType: 'stream'
        });
        const writer = fs.createWriteStream(filename);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await xy.api.sendPhoto(xy.chat.id, new InputFile(filename), {
          caption: '✅ *Screenshot berhasil diambil!*',
          parse_mode: 'Markdown'
        });

        fs.unlinkSync(filename); // hapus setelah dikirim
      } catch (err) {
        console.error('Kesalahan saat mengambil screenshot:', err);
        reply('❌ *Gagal mengambil screenshot, coba lagi nanti!*');
      }
      break;
    }

    case 'aimusic': {
      if (!text) return reply('❌ *Format salah!*\n\nGunakan: /aimusic [IDE MUSIK]`\n\nContoh:\n/aimusic musik yang tenang instrumental`');

      try {
        reply('🎶 Sedang membuat musik dari idemu...\nMohon tunggu sebentar...');

        const result = await genmusic(text);
        if (!result || !result[0]?.audio_url) {
          return reply('❌ Gagal menghasilkan musik.\nCoba lagi dengan ide yang berbeda.');
        }

        const audio = result[0].audio_url;
        const title = result[0].title || 'Musik AI';
        const info = `🎵 Musik Selesai!\n\n📝 Judul: ${title}\n💡 Ide: ${text}\n\n⬆️ Mengunggah musik ke server...`;

        reply(info, {
          parse_mode: "Markdown"
        });

        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, 'music_ai.mp3');

        const res = await axios.get(audio, {
          responseType: 'stream'
        });
        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const uploadedUrl = await CatBox(filePath);

        await xy.api.sendAudio(xy.chat.id, uploadedUrl, {
          caption: `🎵 *${title}*`,
          parse_mode: "Markdown"
        });

        fs.unlinkSync(filePath);

      } catch (e) {
        console.error('GenMusic Error:', e);
        reply(`❌ *Gagal membuat musik dari idemu*\n\nError: \`${e.message}\``, {
          parse_mode: "Markdown"
        });
      }
      break;
    }

    case "igdl": {
      if (!text) return reply(`❌ *Format salah!*\n\nContoh penggunaan:\n/igdl https://www.instagram.com/p/xyz`);

      if (!text.includes("instagram.com/")) {
        return reply("❌ *Link Instagram tidak valid!*");
      }

      try {
        await reply("⏳ *Sedang memproses media dari Instagram...*");

        const data = await igdl(text);

        if (!data || !Array.isArray(data) || data.length === 0) {
          return reply("❌ *Tidak ada media yang ditemukan di link Instagram tersebut!*");
        }

        let alreadySent = new Set();

        for (const item of data) {
          if (!item.url || alreadySent.has(item.url)) continue;

          try {
            const isVideo = text.includes("/reel/") || text.includes("/reels/");
            const ext = isVideo ? ".mp4" : ".jpg";

            const filePath = `./igmedia${ext}`;

            const writer = fs.createWriteStream(filePath);
            const response = await axios({
              url: item.url,
              method: "GET",
              responseType: "stream",
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
              writer.on("finish", resolve);
              writer.on("error", reject);
            });


            const stats = fs.statSync(filePath);

            const uploadedUrl = await CatBox(filePath);
            alreadySent.add(item.url);

            if (isVideo) {
              await xy.api.sendVideo(xy.chat.id, uploadedUrl, {
                caption: "🎥 *Berikut adalah video dari Instagram!*",
                parse_mode: "Markdown"
              });
            } else {
              await xy.api.sendPhoto(xy.chat.id, uploadedUrl, {
                caption: "🖼️ *Berikut adalah foto dari Instagram!*",
                parse_mode: "Markdown"
              });
            }

            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }

          } catch (itemError) {
            console.error(`Error processing item ${item.url}:`, itemError);
            const cleanupFiles = [`./igmedia.jpg`, `./igmedia.mp4`];
            cleanupFiles.forEach(file => {
              if (fs.existsSync(file)) {
                fs.unlinkSync(file);
              }
            });
            continue;
          }
        }

        if (alreadySent.size === 0) {
          reply("❌ *Gagal mengunduh media. Coba link lain!*");
        } else {
          reply(`✅ *Media Instagram berhasil diunduh! (${alreadySent.size} file)*`);
        }

      } catch (err) {
        console.error("Kesalahan saat mengunduh dari Instagram:", err);
        reply("❌ *Terjadi kesalahan saat mengunduh media Instagram!*");
      }
      break;
    }

    case 'spo':
    case 'spotify':
    case 'spotifydl':
    case 'playspotify': {
      if (!q) return reply(`*Masukkan URL Spotify!* ${prefix + command} https://open.spotify.com/track/...`);
      if (!q.includes('spotify.com')) return reply('❌ Masukkan URL Spotify yang valid!');

      try {
        const res = await fetch(`https://api.nekorinn.my.id/downloader/spotify?url=${encodeURIComponent(q)}`);
        if (!res.ok) return reply('❌ Gagal mengambil data lagu.');

        const data = await res.json();
        if (!data.status) return reply('❌ Lagu tidak ditemukan!');

        const {
          title,
          artist,
          duration,
          imageUrl,
          downloadUrl,
          link
        } = data.result;

        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');

        const fileName = `${title.replace(/[^\w\s]/gi, '')}.mp3`;
        const filePath = path.join('./temp', fileName);

        if (!fs.existsSync('./temp')) {
          fs.mkdirSync('./temp', {
            recursive: true
          });
        }

        const response = await axios({
          method: 'GET',
          url: downloadUrl,
          responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        let thumbnailPath = null;
        if (imageUrl) {
          try {
            const thumbFileName = `thumb_${Date.now()}.jpg`;
            thumbnailPath = path.join('./temp', thumbFileName);

            const thumbResponse = await axios({
              method: 'GET',
              url: imageUrl,
              responseType: 'stream'
            });

            const thumbWriter = fs.createWriteStream(thumbnailPath);
            thumbResponse.data.pipe(thumbWriter);

            await new Promise((resolve, reject) => {
              thumbWriter.on('finish', resolve);
              thumbWriter.on('error', reject);
            });
          } catch (thumbErr) {
            console.error("Thumbnail download error:", thumbErr);
          }
        }

        await xy.api.sendAudio(xy.chat.id, new InputFile(filePath), {
          caption: `🎵 *${title}*\n👤 ${artist}\n⏱️ ${duration}`,
          title: title,
          performer: artist,
          thumbnail: thumbnailPath ? new InputFile(thumbnailPath) : undefined
        });

        fs.unlinkSync(filePath);

      } catch (err) {
        console.error("Spotify Error:", err);
        reply("❌ Gagal download lagu Spotify.");
      }

      break;
    }

    case 'pinterest':
    case 'pin': {
      if (!text) return reply(`• *Contoh:* ${prefix + command} Anime`);

      await reply('⏳ Sedang mencari gambar dari Pinterest...');

      const pinterest = require('../src/lib/pinterest');

      try {
        let images = await pinterest(text);

        if (!images || images.length === 0) {
          return xy.api.sendMessage(xy.chat.id, {
            text: `❌ Tidak ditemukan gambar untuk "${text}".`,
          });
        }

        images = images.sort(() => Math.random() - 0.5); // Acak gambar
        const selectedImages = images.slice(0, 5);

        let i = 1;
        for (const imageUrl of selectedImages) {
          await xy.api.sendPhoto(xy.chat.id, imageUrl, {
            caption: `📸 Gambar ke-${i++}`,
          });
        }

        await reply(`✅ Berikut hasil pencarian Pinterest untuk "${text}".`);

      } catch (err) {
        console.error('Pinterest Error:', err);
        await xy.api.sendMessage(xy.chat.id, {
          text: `❌ Terjadi kesalahan saat mengambil gambar dari Pinterest.`,
        });
      }
      break;
    }

    case 'installpanel': {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(',').length < 5) {
        return reply(`❌ *Format salah!*\n\nGunakan: \n/installpanel ipvps, passwordvps, paneldomain, nodedomain, ram\n\nContoh:\n/installpanel 192.168.1.1, mypassword, panel.example.com, node.example.com, 2048`);
      }

      let [vpsIP, vpsPassword, panelDomain, nodeDomain, nodeRAM] = text.split(',').map(a => a.trim());

      let dbName = generateReadableString(8);
      let pswd = generateReadableString(8);
      let dbUsername = generateReadableString(8);
      let randomNumber = Math.floor(1000 + Math.random() * 9000);
      let usradmn = `admin${randomNumber}`
      let pwadmn = `Admin${randomNumber}`

      const ssh = new Client();

      function installPanel() {
        reply(`🔄 *Menginstall Pterodactyl Panel di VPS ${vpsIP}...*`);
        ssh.exec(`bash <(curl -s https://pterodactyl-installer.se)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan instalasi panel!*`);

          stream.on('data', (data) => {
            let output = data.toString();

            if (output.includes("Input 0-6")) {
              stream.write("0\n");
            }
            if (output.includes("(y/N)")) {
              stream.write("y\n");
            }
            if (output.includes("Database name (panel)")) {
              stream.write(`${dbName}\n`);
            }
            if (output.includes("Database username (pterodactyl)")) {
              stream.write(`${dbUsername}\n`);
            }
            if (output.includes("Password (press enter to use randomly generated password)")) {
              stream.write("admin\n");
            }
            if (output.includes("Select timezone [Europe/Stockholm]")) {
              stream.write("Asia/Jakarta\n");
            }
            if (output.includes("Provide the email address")) {
              stream.write("admin@gmail.com\n");
            }
            if (output.includes("Email address for the initial admin account")) {
              stream.write(`admin${randomNumber}@gmail.com\n`);
            }
            if (output.includes("Username for the initial admin account")) {
              stream.write(`${usradmn}\n`);
            }
            if (output.includes("First name for the initial admin account")) {
              stream.write(`${usradmn}\n`);
            }
            if (output.includes("Last name for the initial admin account")) {
              stream.write(`${usradmn}\n`);
            }
            if (output.includes("Password for the initial admin account")) {
              stream.write(`${pwadmn}\n`);
            }
            if (output.includes("Set the FQDN of this panel")) {
              stream.write(`${panelDomain}\n`);
            }
            if (output.includes("Do you want to automatically configure UFW")) {
              stream.write("y\n");
            }
            if (output.includes("Do you want to automatically configure HTTPS")) {
              stream.write("y\n");
            }
            if (output.includes("Select the appropriate number")) {
              stream.write("1\n");
            }
            if (output.includes("I agree that this HTTPS request is performed")) {
              stream.write("y\n");
            }
            if (output.includes("Proceed anyways")) {
              stream.write("y\n");
            }
            if (output.includes("(yes/no)")) {
              stream.write("y\n");
            }
            if (output.includes("Initial configuration completed. Continue?")) {
              stream.write("y\n");
            }
            if (output.includes("Still assume SSL? (y/N)")) {
              stream.write("y\n");
            }
            if (output.includes("Please read the Terms of Service")) {
              stream.write("y\n");
            }
            if (output.includes("(A)gree/(C)ancel:")) {
              stream.write("A\n");
            }
          });
          stream.on('close', () => {
            reply(`✅ *Panel berhasil diinstall! Sekarang membuat lokasi...*`);
            makeLocation();
          });
        });
      }

      function makeLocation() {
        ssh.exec(`
cd /var/www/pterodactyl && php artisan p:location:make <<EOF
Singapore
Lokasi Singapura
EOF
        `, (err, stream) => {
          if (err) return reply(`❌ *Gagal membuat lokasi!*`);

          let locationId = 1;

          stream.on('data', (data) => {
            let match = data.toString().match(/ID:\s*(\d+)/);
            if (match) {
              locationId = match[1]; // Ambil ID lokasi
            }
          });

          stream.on('close', () => {
            if (locationId) {
              reply(`✅ *Lokasi berhasil dibuat dengan ID ${locationId}!*`);
              makeNode(locationId);
            } else {
              reply(`❌ *Gagal mendapatkan ID lokasi!*`);
            }
          });
        });
      }

      function makeNode(locationId) {
        ssh.exec(`
cd /var/www/pterodactyl && php artisan p:node:make <<EOF
Node Singapore
Singapore
${locationId}
https
${nodeDomain}
yes
no
no
${nodeRAM}
${nodeRAM}
2048
2048
100
8080
2022
/var/lib/pterodactyl/volumes
EOF
        `, (err, stream) => {
          if (err) return reply(`❌ *Gagal membuat node!*`);

          stream.on('data', (data) => {});

          stream.on('close', () => {
            reply("✅ *Node berhasil dibuat!*");
            installWings();
          });
        });
      }

      function installWings() {
        ssh.exec(`bash <(curl -s https://pterodactyl-installer.se)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan instalasi Wings!*`);

          stream.on('data', (data) => {
            let output = data.toString();

            if (output.includes("Input 0-6")) {
              stream.write("1\n");
            }
            if (output.includes("(y/N)")) {
              stream.write("y\n");
            }
            if (output.includes("Enter the panel address (blank for any address):")) {
              stream.write(`${panelDomain}\n`);
            }
            if (output.includes("Database host username (pterodactyluser):")) {
              stream.write(`${dbName}\n`);
            }
            if (output.includes("Database host password:")) {
              stream.write(`${pswd}\n`);
            }
            if (output.includes("Set the FQDN to use for Let's Encrypt (node.example.com):")) {
              stream.write(`${nodeDomain}\n`);
            }
            if (output.includes("Enter email address for Let's Encrypt:")) {
              stream.write("admin@gmail.com\n");
            }

          });

          stream.on('close', () => {
            ssh.end();
            reply(`
✅ *Pterodactyl Panel dan Wings berhasil diinstall di VPS ${vpsIP}!*
🌐 *Login Panel:* ${panelDomain}
👤 *Username:* ${usradmn}  
🔑 *Password:* ${pwadmn}
📂 *Database Name:* ${dbName}
👤 *Database Username:* ${dbUsername}
                `);
          });
        });
      }

      ssh.on('ready', installPanel).connect({
        host: vpsIP,
        port: 22,
        username: 'root',
        password: vpsPassword
      });
    }
    break;

    case 'uninstallpanel': {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(',').length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan: \n/uninstallpanel ipvps, passwordvps\n\nContoh:\n/uninstallpanel 192.168.1.1, mypassword`);
      }

      let [vpsIP, vpsPassword] = text.split(',').map(a => a.trim());

      reply(`🔄 *Menghapus Pterodactyl Panel dari VPS ${vpsIP}...*`);

      const ssh = new Client();
      ssh.on('ready', () => {
        ssh.exec(`bash <(curl -s https://pterodactyl-installer.se)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah uninstall!*`);

          stream.on('data', (data) => {
            if (data.includes("Input 0-6")) stream.write("6\n");
            if (data.toString().includes('(y/N)')) {
              stream.write('y\n');
            }
            if (data.toString().includes('Choose the panel database (to skip don\'t input anything)')) {
              stream.write('\n');
            }
            if (data.toString().includes('Choose the panel database (to skip don\'t input anything)')) {
              stream.write('\n');
            }

          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Pterodactyl Panel berhasil dihapus dari VPS ${vpsIP} tanpa sisa!*`);
          });
        });
      }).connect({
        host: vpsIP,
        port: 22,
        username: 'root',
        password: vpsPassword
      });
    }
    break;

    case 'startwings': {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(',').length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan: \n/uninstallpanel ipvps, passwordvps\n\nContoh:\n/uninstallpanel 192.168.1.1, mypassword`);
      }

      let [vpsIP, vpsPassword, token] = text.split(',').map(a => a.trim());

      reply(`🔄 *Configuration Node Panel dari VPS ${vpsIP}...*`);

      const ssh = new Client();
      ssh.on('ready', () => {
        ssh.exec(`${token} && systemctl start wings`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah uninstall!*`);

          stream.on('data', (data) => {
            stream.write('y\n')

          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Configuration Node Panel berhasil dihapus dari VPS ${vpsIP}!*`);
          });
        });
      }).connect({
        host: vpsIP,
        port: 22,
        username: 'root',
        password: vpsPassword
      });
    }
    break;

    case "installtemastellar": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemastellar ipvps,pwvps\n\nContoh:\n/installtemastellar 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema Stellar di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();


            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("1\n"); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema Stellar berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "installtemanebula": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemanebula ipvps,pwvps\n\nContoh:\n/installtemanebula 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema Nebula di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();

            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("2\n"); // Pilih Stellar
            }

            if (output.includes("Press 'RETURN' to continue.")) {
              stream.write("RETURN\n"); // Pilih Stellar
            }

            if (output.includes("Press 'RETURN' to continue")) {
              stream.write("RETURN\n"); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema Nebula berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "installtemadarknate": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemadarknate ipvps,pwvps\n\nContoh:\n/installtemadarknate 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema Darknate di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();


            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("3\n"); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema Darknate berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "installtemaenigma": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemaenigma ipvps,pwvps,linkmedsos\n\nContoh:\n/installtemaenigma 192.168.1.1,mypassword,https://wa.me/62123456789`);
      }

      let [ipvps, passwd, linkmed] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema Enigma di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();


            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("4\n"); // Pilih Stellar
            }

            if (output.includes("Masukkan Link Nomor Telegram/Whatsapp:")) {
              stream.write(`${linkmed}\n`); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema Enigma berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "installtemabilling": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemabilling ipvps,pwvps\n\nContoh:\n/installtemabilling 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema Billing di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();

            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("5\n"); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema Billing berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "installtemaiceminecraft": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemaiceminecraft ipvps,pwvps\n\nContoh:\n/installtemaiceminecraft 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema IceMinecraft di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();

            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("6\n"); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema IceMinecraft berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "installtemanook": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemanook ipvps,pwvps\n\nContoh:\n/installtemanook 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema Nook di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();


            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("7\n"); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema Nook berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "installtemanightcore": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/installtemanightcore ipvps,pwvps\n\nContoh:\n/installtemanightcore 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Memulai instalasi tema Nightcore di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah install!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();

            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("1\n"); // Pilih install
            }

            if (output.includes("Pilih tema yang ingin diinstall:")) {
              stream.write("8\n"); // Pilih Stellar
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema Nightcore berhasil diinstall di VPS ${ipvps}!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case "uninstalltema": {
      if (!isOwner) return reply(`❌ *Hanya owner yang bisa menggunakan perintah ini!*`);

      if (!text || text.split(",").length < 2) {
        return reply(`❌ *Format salah!*\n\nGunakan:\n/uninstalltema ipvps,pwvps\n\nContoh:\n/uninstalltema 192.168.1.1,mypassword`);
      }

      let [ipvps, passwd] = text.split(",").map(a => a.trim());

      const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
      };

      const ssh = new Client();
      ssh.on('ready', () => {
        reply(`🔄 *Menghapus tema di VPS ${ipvps}...*`);

        ssh.exec(`bash <(curl -s https://raw.githubusercontent.com/XieTyyOfc/themeinstaller/master/install.sh)`, (err, stream) => {
          if (err) return reply(`❌ *Gagal menjalankan perintah uninstall!*`);

          stream.on('data', (data) => {
            const output = data.toString().trim();

            if (output.includes("Masukkan token:")) {
              stream.write("xietyofc\n");
            }

            if (output.includes("Pilih aksi:")) {
              stream.write("2\n"); // Pilih uninstall
            }
          });

          stream.on('close', () => {
            ssh.end();
            reply(`✅ *Tema berhasil dihapus dari VPS ${ipvps}, panel kembali ke default!*`);
          });

          stream.stderr.on('data', (data) => {

          });
        });
      }).on('error', (err) => {

        reply(`❌ *IP atau password VPS salah!*`);
      }).connect(connSettings);
    }
    break;

    case 'ai':
    case 'gpt':
    case 'nekogpt': {
      if (!q) return reply(`*Masukkan pertanyaan atau perintah!* Contoh: ${prefix + command} Halo, apa kabar?`);

      try {
        const res = await fetch(`https://api.nekorinn.my.id/ai/gpt-4.1-mini?text=${encodeURIComponent(q)}`);
        if (!res.ok) return reply('❌ Gagal menghubungi AI.');

        const data = await res.json();
        if (!data.status || !data.result) return reply('❌ Tidak ada respons dari AI.');

        return reply(data.result);

      } catch (err) {
        console.error("AI Error:", err);
        return reply("❌ Terjadi kesalahan saat mengakses AI.");
      }

      break;
    }

    case 'aivid':
    case 'vidai':
    case 'aivideo': {
      if (!q) return reply(`*Masukkan deskripsi video!* Contoh: ${prefix + command} Pegunungan`);

      try {
        const videoUrl = `https://api.nekorinn.my.id/ai-vid/videogpt?text=${encodeURIComponent(q)}`;



        const filePath = path.join(__dirname, 'temp_aivid.mp4');

        const res = await axios.get(videoUrl, {
          responseType: 'stream'
        });
        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const uploadedUrl = await CatBox(filePath);


        await xy.replyWithVideo(uploadedUrl, {
          caption: `🎥 *Hasil Video AI*\n\nPrompt: ${q}`,
          parse_mode: "Markdown"
        });

        fs.unlinkSync(filePath);

      } catch (e) {
        console.error('AI Video Error:', e.message);
        reply('❌ Gagal menghasilkan atau mengunggah video.');
      }

      break;
    }

    case 'aiimg':
    case 'imgai':
    case 'aigambar': {
      if (!q) return reply(`*Masukkan deskripsi gambar!* Contoh: ${prefix + command} Anime`);

      const imageUrl = `https://api.nekorinn.my.id/ai-img/ai4chat?text=${encodeURIComponent(q)}&ratio=16%3A9`;
      await xy.replyWithPhoto(imageUrl, {
        caption: `🖼️ *Hasil Gambar AI*\n\nPrompt: ${q}`
      });
      break;
    }

    case 'listpanel': {
      if (!isOwner) return reply(mess.owner);
      let halamanPanel = parseInt(text.split(" ")[1]) || 1;
      if (halamanPanel > 25) return reply("⚠️ Maksimal hanya bisa melihat sampai halaman 25!");

      try {
        let response = await fetch(`${global.domain}/api/application/servers?page=${halamanPanel}&per_page=25`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${global.plta}`
          }
        });

        let hasil = await response.json();
        if (!response.ok) return reply(`🚫 Gagal mendapatkan data. Kode error: ${response.status}`);
        if (hasil.errors) return reply(`⚠️ Kesalahan ditemukan: ${JSON.stringify(hasil.errors[0], null, 2)}`);
        if (!hasil.data || hasil.data.length === 0) return reply("📌 Tidak ada server yang terdaftar dalam sistem.");

        let daftarServer = `📡 *Daftar Server yang Aktif (Halaman ${halamanPanel})* 📡\n`;
        daftarServer += "━━━━━━━━━━━━━━━━━━━━━━━\n";

        for (let server of hasil.data) {
          let info = server.attributes;
          daftarServer += `🆔 *Server ID*: \`${info.id}\`\n`;
          daftarServer += `🔹 *Nama Server*: ${info.name}\n`;
          daftarServer += "───────────────────────\n";
        }

        daftarServer += `📄 *Halaman*: ${hasil.meta.pagination.current_page}/${hasil.meta.pagination.total_pages}\n`;
        daftarServer += `📊 *Total Server Terdaftar*: ${hasil.meta.pagination.count}`;

        let buttons = [];

        if (hasil.meta.pagination.current_page < hasil.meta.pagination.total_pages && halamanPanel < 25) {
          buttons.push({
            text: "➡️ Halaman Berikutnya",
            callback_data: `listpanel ${halamanPanel + 1}`
          });
        }
        if (halamanPanel > 1) {
          buttons.unshift({
            text: "⬅️ Halaman Sebelumnya",
            callback_data: `listpanel ${halamanPanel - 1}`
          });
        }

        const sent = await reply(daftarServer, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: buttons.length > 0 ? [buttons] : []
          }
        });

        global.lastListPanelMessageId = sent.message_id;

      } catch (err) {
        console.log("❗ Error:", err);
        reply(`⚠️ Terjadi kesalahan: ${err.message}`);
      }
      break;
    }

    case 'listusr': {
      if (!isOwner) return reply(mess.owner);
      let halamanUsr = text[1] || '1';

      try {
        let response = await fetch(`${global.domain}/api/application/users?page=${halamanUsr}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${global.plta}`
          }
        });

        let hasil = await response.json();
        if (!response.ok) return reply(`❌ Gagal mengambil data. Kode error: ${response.status}`);
        if (hasil.errors) return reply(`⚠️ Kesalahan: ${JSON.stringify(hasil.errors[0], null, 2)}`);
        if (!hasil.data || hasil.data.length === 0) return reply("📌 Tidak ada pengguna yang ditemukan.");

        let daftarUser = "👥 *Daftar Pengguna Terdaftar* 👥\n";
        daftarUser += "━━━━━━━━━━━━━━━━━━━━━━━\n";

        for (let user of hasil.data) {
          let info = user.attributes;
          daftarUser += `🆔 *User ID*: \`${info.id}\`\n`;
          daftarUser += `🔸 *Username*: ${info.username}\n`;
          daftarUser += "───────────────────────\n";
        }

        daftarUser += `📄 *Halaman*: ${hasil.meta.pagination.current_page}/${hasil.meta.pagination.total_pages}\n`;
        daftarUser += `📊 *Total Pengguna*: ${hasil.meta.pagination.count}`;

        await reply(daftarUser, {
          parse_mode: "Markdown"
        });

        if (hasil.meta.pagination.current_page < hasil.meta.pagination.total_pages) {
          await reply(`➡️ Gunakan perintah: \`/listusr ${parseInt(halamanUsr) + 1}\` untuk melihat halaman berikutnya.`, {
            parse_mode: "Markdown"
          });
        }

      } catch (err) {
        console.log("❗ Error:", err);
        reply(`⚠️ Terjadi kesalahan: ${err.message}`);
      }
      break;
    }

    case 'listadmin': {
      if (!isOwner) return reply(mess.owner);
      let halamanAdmin = text[1] || '1';

      try {
        let response = await fetch(`${global.domain}/api/application/users?page=${halamanAdmin}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${global.plta}`
          }
        });

        let hasil = await response.json();
        if (!response.ok) return reply(`❌ Gagal mengambil daftar admin. Kode error: ${response.status}`);
        if (hasil.errors) return reply(`⚠️ Terjadi kesalahan: ${JSON.stringify(hasil.errors[0], null, 2)}`);

        let daftarAdmin = hasil.data.filter(user => user.attributes.root_admin === true);
        if (daftarAdmin.length === 0) return reply("🚫 Tidak ada admin yang terdaftar.");

        let pesanAdmin = "👑 *Daftar Administrator* 👑\n";
        pesanAdmin += "━━━━━━━━━━━━━━━━━━━━━━━\n";

        for (let admin of daftarAdmin) {
          let info = admin.attributes;
          pesanAdmin += `🆔 *Admin ID*: \`${info.id}\`\n`;
          pesanAdmin += `🔹 *Nama*: ${info.username}\n`;
          pesanAdmin += "───────────────────────\n";
        }

        pesanAdmin += `📄 *Halaman*: ${hasil.meta.pagination.current_page}/${hasil.meta.pagination.total_pages}\n`;
        pesanAdmin += `📊 *Total Admin Dihalaman Ini*: ${daftarAdmin.length}`;

        await reply(pesanAdmin, {
          parse_mode: "Markdown"
        });

        if (hasil.meta.pagination.current_page < hasil.meta.pagination.total_pages) {
          await reply(`➡️ Gunakan perintah: \`/listadmin ${parseInt(halamanAdmin) + 1}\` untuk melihat halaman berikutnya.`, {
            parse_mode: "Markdown"
          });
        }

      } catch (err) {
        console.log("❗ Error:", err);
        await reply(`⚠️ Terjadi kesalahan: ${err.message}`);
      }
      break;
    }

    case "delusr":
    case "deladmin": {
      if (!isOwner) return reply(mess.owner);

      if (!text || !/^\d+$/.test(text)) {
        return reply(`*Format salah!*

Penggunaan:
${prefix + command} user_id

Contoh:
${prefix + command} 1`, {
          parse_mode: "Markdown"
        });
      }

      let userId = text;

      try {
        let f = await fetch(`${global.domain}/api/application/users/${userId}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${global.plta}`
          }
        });

        let textResponse = await f.text();
        let data = {};

        if (textResponse) {
          try {
            data = JSON.parse(textResponse);
          } catch (err) {
            return reply(`⚠️ Gagal memproses respons API: ${err.message}`);
          }
        }

        if (data.errors) {
          return reply(`❌ Gagal menghapus user:\n${JSON.stringify(data.errors[0], null, 2)}`);
        }

        return reply(`✅ User dengan ID ${userId} berhasil dihapus.`);
      } catch (err) {
        console.error("Error:", err);
        return reply(`❌ Terjadi kesalahan: ${err.message}`);
      }
      break
    }


    case "delsrv": {
      if (!isOwner) return reply(mess.owner);

      if (!text || !/^\d+$/.test(text)) {
        return reply(`*Format salah!*

Penggunaan:
${prefix + command} server_id

Contoh:
${prefix + command} 1`, {
          parse_mode: "Markdown"
        });
      }

      let serverId = text;

      try {
        let f = await fetch(`${global.domain}/api/application/servers/${serverId}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${global.plta}`
          }
        });

        let textResponse = await f.text();
        let data = {};

        if (textResponse) {
          try {
            data = JSON.parse(textResponse);
          } catch (err) {
            return reply(`⚠️ Gagal memproses respons API: ${err.message}`);
          }
        }

        if (data.errors) {
          return reply(`❌ Gagal menghapus server:\n${JSON.stringify(data.errors[0], null, 2)}`);
        }

        return reply(`✅ Server dengan ID ${serverId} berhasil dihapus.`);
      } catch (err) {
        console.error("Error:", err);
        return reply(`❌ Terjadi kesalahan: ${err.message}`);
      }
      break
    }

    case "connect": {
      if (!isOwner) return reply(mess.owner);
      if (!text) return reply('Gunakan: /connect nomor_telepon');

      const number = text.trim(); // pastikan tanpa spasi
      if (sessions.has(number)) return reply(`❗ WhatsApp ${number} sudah terhubung.`);

      try {
        let sent = await xy.api.sendMessage(xy.chat.id, {
          text: `🔄 Memulai koneksi ke WhatsApp ${number}...`
        });

        startWhatsAppSession(number, xy.chat.id, sent.message_id)
          .then(() => xy.api.sendMessage(xy.chat.id, {
            text: `✅ Proses koneksi ke WhatsApp ${number} sedang berjalan.`
          }))
          .catch(err => xy.api.sendMessage(xy.chat.id, {
            text: `❌ Gagal menghubungkan WhatsApp ${number}: ${err.message}`
          }));
      } catch (e) {
        console.error("Gagal kirim pesan:", e);
        return reply(`❌ Terjadi error saat mengirim pesan: ${e.message}`);
      }
    }
    break;

    case 'send':
      if (!isOwner) return reply(mess.owner);
      if (text.length < 2) return reply('Gunakan: /send nomor_tujuan, teks_pesan');

      let [targetNumber, textMessage] = text.split(",").map(a => a.trim());
      targetNumber = targetNumber.replace(/\D/g, ''); // Bersihkan nomor tujuan



      if (!targetNumber) return reply('Nomor tujuan tidak valid.');
      if (!textMessage) return reply('Pesan tidak boleh kosong.');
      if (sessions.size === 0) return reply('Tidak ada sesi WhatsApp yang aktif.');

      const sessionNumber = Array.from(sessions.keys())[0];
      const waClient = sessions.get(sessionNumber);

      if (!waClient) return reply(`Sesi WhatsApp ${sessionNumber} tidak ditemukan.`);

      try {
        const jid = targetNumber.includes("@") ? targetNumber : `${targetNumber}@s.whatsapp.net`;
        await waClient.sendMessage(jid, {
          text: textMessage
        });
        reply(`✅ Pesan berhasil dikirim ke ${targetNumber} menggunakan sesi ${sessionNumber}`);
      } catch (error) {
        console.error(`⚠️ Gagal mengirim pesan ke ${targetNumber}:`, error);
        reply(`❌ Gagal mengirim pesan ke ${targetNumber}. Error: ${error.message}`);
      }
      break;

    case "disconnect": {
      if (!isOwner) return reply(mess.owner);
      if (!text) return reply('Gunakan: /disconnect nomor_telepon\nContoh: /disconnect 6281234567890');

      const number = text.trim();

      if (!sessions.has(number)) {
        return reply(`❌ Session WhatsApp ${number} tidak ditemukan.`);
      }

      try {
        const waClient = sessions.get(number);

        if (waClient) {
          await waClient.logout();
        }

        sessions.delete(number);

        updateActiveSessions();

        return reply(`✅ Session WhatsApp ${number} berhasil diputus dan dihapus.`);

      } catch (error) {
        console.error("Error disconnecting WhatsApp session:", error);

        sessions.delete(number);
        updateActiveSessions();

        return reply(`⚠️ Session WhatsApp ${number} dihapus dengan paksa.\nError: ${error.message}`);
      }
    }
    break;


    case "pay": {
      if (!text) {
        reply('Lengkapi Command kamu!\n\nContoh: .pay 1000');
        return;
      }

      if (text < 1000) {
        return reply(`Minimal Transaksi harus Rp ${minimalDeposit}`);
      }

      let val = text
        .replace(/[^0-9\-\/+*×÷πEe()piPI/]/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π|pi/gi, 'Math.PI')
        .replace(/e/gi, 'Math.E')
        .replace(/\/+/g, '/')
        .replace(/\++/g, '+')
        .replace(/-+/g, '-');

      let deponya;
      try {
        let result = (new Function('return ' + val))();
        if (!result) throw result;
        deponya = result;
      } catch (e) {
        reply('Format salah, hanya 0-9 dan simbol -, +, *, /, ×, ÷, π, e, (, ) yang disupport');
        return;
      }

      let ref = Math.floor(Math.random() * 100000000);
      let h2hkey = apikeyhost

      let config = {
        method: 'POST',
        url: 'https://atlantich2h.com/deposit/create',
        data: new URLSearchParams({
          api_key: h2hkey,
          reff_id: ref,
          nominal: deponya,
          type: 'ewallet',
          metode: 'qris'
        })
      };

      axios(config).then(async res => {
        if (!res.data.status) {
          reply(`*_Error: ${res.data.message || 'Unknown error'}_*`);
          return;
        }

        const toqrcode = require('../src/lib/qrcode');
        const qrData = res.data.data.qr_string;

        const qrMessage = `Silahkan scan Qriss diatas untuk membayar sejumlah:\n
        Bill: ${res.data.data.nominal} 
        Status: ${res.data.data.status}\n\n
        Jika ingin cancel transaksi ketik :
        /cancelpay
        note: ketik command itu sekalian reply pesan ini (khusus owner)  
        `;

        let sent;
        try {
          const qrImageUrl = await toqrcode(qrData);
          sent = await xy.api.sendPhoto(sender, qrImageUrl, {
            caption: qrMessage
          });
        } catch (qrError) {
          const fallbackMsg = qrMessage + '\n\n🔗 BUKA QR CODE:\n' + res.data.data.qr_image + '\n\n_Klik link untuk scan QR Code_';
          reply(fallbackMsg);
        }

        let obj = {
          id: sender,
          ref: res.data.data.id,
          messageId: sent.message_id,
          status: res.data.data.status
        };

        fs.writeFileSync(`./src/database/datasaldo/${sender}.json`, JSON.stringify(obj));

        let status = res.data.data.status;
        const topup = {
          method: 'POST',
          url: 'https://atlantich2h.com/deposit/status',
          data: new URLSearchParams({
            api_key: h2hkey,
            id: res.data.data.id
          })
        };

        const acc = {
          method: 'POST',
          url: 'https://atlantich2h.com/deposit/instant',
          data: new URLSearchParams({
            api_key: h2hkey,
            id: res.data.data.id,
            action: 'true'
          })
        };

        while (status !== 'processing') {
          await sleep(1000);

          try {
            const response = await axios(topup);
            status = response.data.data.status;

            if (status === 'cancel' || status === 'expired') {
              reply(`Transaksi ${status}`);
              break;
            }

            if (status === 'processing') {
              await axios(acc);
              status = 'success';

              if (sent?.message_id) {
                await xy.api.deleteMessage(sender, sent.message_id);
              }

              let suksesMsg = `
                    Transaksi telah sukses 
                    
                    Terimakasih atas pembelian Anda`;
              reply(suksesMsg);
              fs.unlinkSync(`./src/database/datasaldo/${sender}.json`);
              break;
            }
          } catch (error) {
            console.log('Error checking status:', error.message);
            reply('Terjadi error saat mengecek status pembayaran');
            break;
          }
        }
      }).catch(error => {
        console.log('Deposit error:', error.message);
        reply('Terjadi error saat membuat deposit. Silakan coba lagi.');
      });
    }
    break;

    case "cancelpay": {
      if (!isOwner) return reply(mess.owner)
      const dbPath = `./src/database/datasaldo/${sender}.json`;

      if (!fs.existsSync(dbPath)) {
        return reply("❌ Kamu tidak memiliki deposit yang sedang berlangsung.");
      }

      const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      const config = {
        method: "POST",
        url: "https://atlantich2h.com/deposit/cancel",
        data: new URLSearchParams({
          api_key: apikeyhost,
          id: data.ref
        })
      };

      axios(config)
        .then(async () => {
          await reply("✅ Deposit berhasil dibatalkan.");


          await xy.api.deleteMessage(sender, data.messageId);

          fs.unlinkSync(dbPath);
        })
        .catch(error => {
          console.error("❌ Gagal membatalkan deposit:", error?.response?.data || error.message);
          reply("❌ Gagal membatalkan deposit. Mungkin sudah dibayar atau ID tidak ditemukan.");
        });
    }
    break;

    case 'addlist':
      if (!xy.chat || xy.chat.type === 'private') return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.GrupAdmin);
      if (!text.includes("@")) return reply(`Cara Addlist Dengan Benar\n\n/addlist Namalist@isilist\n\nLakukan Dengan Benar Jangan Sampai Salah\n\nAtau bisa juga dengan mengirim gambar dengan caption: /${command} tes@apa`);

      let [text1, text2] = text.split("@").map(a => a.trim());

      if (isAlreadyResponList1(xy.chat.id, text1, db_respon_list)) {
        return reply(`❌ List respon dengan key: *${text1}* sudah ada di grup ini.`, {
          parse_mode: "Markdown"
        });
      }

      if (xy.message.photo) {
        try {
          let fileId = xy.message.photo[xy.message.photo.length - 1].file_id;
          let file = await xy.api.getFile(fileId);
          let fileUrl = `https://api.telegram.org/file/bot${xy.api.token}/${file.file_path}`;

          addResponList1(xy.chat.id, text1, text2, true, fileUrl, db_respon_list);
          reply(`✅ Berhasil menambah List menu dengan gambar: *${text1}*`, {
            parse_mode: "Markdown"
          });
        } catch (error) {
          console.error("❌ Gagal mengambil gambar:", error);
          return reply("⚠️ Terjadi kesalahan saat mengambil gambar dari Telegram.");
        }
      } else {
        addResponList1(xy.chat.id, text1, text2, false, '-', db_respon_list);
        reply(`✅ Berhasil menambah List menu: *${text1}*`, {
          parse_mode: "Markdown"
        });
      }
      break;

    case 'listproduk':
      if (!xy.chat || xy.chat.type === 'private') return reply(mess.group);
      if (db_respon_list.length === 0) return reply(`Belum ada list message di database/group ini.`);

      let filteredList = db_respon_list.filter(item => item.id === xy.chat.id);
      if (filteredList.length === 0) return reply(`Belum ada list message terdaftar di grup ini.`);

      let listText = `📋 List Menu di Grup Ini 📋\n\n`;

      filteredList.forEach((item, index) => {
        listText += `${index + 1}. 🛍️ ${item.key}\n`;
      });

      listText += `\n💡 Cara menggunakan:\n`;
      listText += `Ketik nama menu yang ingin dilihat, contoh:\n`;
      listText += `• ${filteredList[0] ? filteredList[0].key : 'NamaMenu'}\n\n`;
      listText += `📝 Total menu: ${filteredList.length}`;

      reply(listText, {
        parse_mode: "Markdown"
      });
      break;

    case 'searchproduk':
    case 'cari':
      if (!xy.chat || xy.chat.type === 'private') return reply(mess.group);
      if (!text) return reply(`🔍 *Pencarian Menu*\n\nGunakan: \`/cari kata_kunci\`\n\nContoh: \`/cari pizza\``);

      let searchResults = db_respon_list.filter(item =>
        item.id === xy.chat.id &&
        (item.key.toLowerCase().includes(text.toLowerCase()) ||
          item.response.toLowerCase().includes(text.toLowerCase()))
      );

      if (searchResults.length === 0) {
        reply(`❌ Tidak ditemukan menu dengan kata kunci: "${text}"\n\nGunakan \`/listproduk\` untuk melihat semua menu.`);
        return;
      }

      let searchText = `🔍 Hasil Pencarian: "${text}"\n`;
      searchText += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      searchResults.forEach((item, index) => {
        searchText += `${index + 1}. 🛍️ ${item.key}\n`;
        let preview = item.response.length > 60 ?
          item.response.substring(0, 60) + "..." :
          item.response;
        searchText += `   └ ${preview}\n\n`;
      });

      searchText += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      searchText += `📊 Ditemukan: ${searchResults.length} hasil`;

      reply(searchText, {
        parse_mode: "Markdown"
      });
      break;

    case 'dellist': {
      if (!xy.chat || xy.chat.type === 'private') return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);
      if (!text) return reply(`Cara Delete List\n\n.dellist [Nama List Yg Ingin Dihapus]\n\nContoh :\n.dellist EPEP\n\nLakukan Dengan Benar Jangan Sampe Salah`);

      let listData = JSON.parse(fs.readFileSync('./src/database/list.json', 'utf8'));

      if (listData.length === 0) return reply(`Belum ada list message di database.`);

      let index = listData.findIndex(item => item.id === xy.chat.id && item.key === text);
      if (index === -1) return reply(`List dengan nama "${text}" tidak ditemukan.`);

      let deletedItem = listData.splice(index, 1)[0];

      fs.writeFileSync('./src/database/list.json', JSON.stringify(listData, null, 2));

      if (typeof db_respon_list !== 'undefined') {
        let memIndex = db_respon_list.findIndex(item => item.id === xy.chat.id && item.key === text);
        if (memIndex !== -1) {
          db_respon_list.splice(memIndex, 1);
        }
      }

      reply(`✅ List "${text}" berhasil dihapus dari database.`);
      break;
    }

    case 'updatelist': {
      if (!xy.chat || xy.chat.type === 'private') return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      const [namaList, isiList] = text.split("@").map(s => s.trim());

      if (!namaList || !isiList) {
        return reply(`Cara Update List\n\n.updatelist NamaList@IsiListBaru\n\nLakukan Dengan Benar Jangan Sampe Salah`);
      }

      let listData = JSON.parse(fs.readFileSync('./src/database/list.json', 'utf8'));

      let index = listData.findIndex(item => item.id === xy.chat.id && item.key === namaList);
      if (index === -1) return reply(`List dengan nama "${namaList}" tidak ditemukan.`);

      listData[index].response = isiList;

      fs.writeFileSync('./src/database/list.json', JSON.stringify(listData, null, 2));

      if (typeof db_respon_list !== 'undefined') {
        let memIndex = db_respon_list.findIndex(item => item.id === xy.chat.id && item.key === namaList);
        if (memIndex !== -1) {
          db_respon_list[memIndex].response = isiList;
        }
      }

      reply(`✅ Response pada list "${namaList}" berhasil diperbarui menjadi:\n\n"${isiList}"`);
      break;
    }

    case 'dellistall': {
      if (!xy.chat || xy.chat.type === 'private') return reply(mess.group);
      if (!isGroupAdmins && !isOwner) return reply(mess.admin);

      let listData = JSON.parse(fs.readFileSync('./src/database/list.json', 'utf8'));

      const groupID = xy.chat.id;

      const newListData = listData.filter(item => item.id !== groupID);

      fs.writeFileSync('./src/database/list.json', JSON.stringify(newListData, null, 2));

      if (typeof db_respon_list !== 'undefined') {
        for (let i = db_respon_list.length - 1; i >= 0; i--) {
          if (db_respon_list[i].id === groupID) {
            db_respon_list.splice(i, 1);
          }
        }
      }

      reply("✅ Semua list di grup ini telah dihapus dari database.");
      break;
    }

    case 'brat': {
      if (!text) return reply("⚠️ Kirim teks untuk meme Brat\nContoh: /brat woy");

      try {
        const url = `https://api.hanggts.xyz/imagecreator/brat?text=${encodeURIComponent(text)}`;
        const filepath = './tmp_brat.png';

        const response = await axios.get(url, {
          responseType: 'arraybuffer'
        });
        fs.writeFileSync(filepath, response.data);


        await xy.api.sendSticker(xy.chat.id, new InputFile(filepath));

        fs.unlinkSync(filepath);
      } catch (err) {
        console.error("Gagal ambil gambar brat:", err.message);
        reply("❌ Gagal ambil gambar dari generator.");
      }

      break;
    }

    case 'voiceai': {
      if (!text) return reply("⚠️ Kirim teks untuk diubah jadi suara\nContoh: /voiceai Halo semua!");

      const axios = require("axios");
      const fs = require("fs");
      const path = require("path");

      try {
        const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(text)}`;
        const filepath = './tmp_voice.mp3';

        const response = await axios.get(url, {
          responseType: 'arraybuffer'
        });
        fs.writeFileSync(filepath, response.data);

        await xy.api.sendVoice(xy.chat.id, new InputFile(filepath));

        fs.unlinkSync(filepath);

      } catch (err) {
        console.error("Gagal generate voice:", err.message);
        reply("❌ Gagal mengubah teks menjadi suara.");
      }

      break;
    }

    case 'toanime': {
      if (!xy.message.photo && !xy.message.reply_to_message?.photo) {
        return reply("⚠️ Kirim foto atau balas foto untuk diubah jadi anime\nContoh: kirim foto lalu /toanime");
      }

      const axios = require("axios");
      const fs = require("fs");
      const path = require("path");
      const mime = require("mime-types");
      const WebSocket = require("ws");
      const crypto = require("crypto");
      const FormData = require("form-data");

      const SESSION = crypto.randomBytes(5).toString("hex").slice(0, 9);
      const WS_URL = "wss://pixnova.ai/demo-photo2anime/queue/join";
      const IMAGE_URL = "https://oss-global.pixnova.ai/";

      let wss;
      let promise;

      function _connect() {
        return new Promise((resolve, reject) => {
          wss = new WebSocket(WS_URL);
          wss.on("open", () => resolve());
          wss.on("error", (err) => reject(err));
          wss.on("message", (chunk) => {
            const data = JSON.parse(chunk.toString());
            if (promise?.once) {
              promise.call(data);
              promise = null;
            } else if (promise) {
              if (data.code === 200 && data.success) {
                data.output.result = data.output.result.map(x => IMAGE_URL + x);
                promise.call(data);
                promise = null;
              }
            }
          });
        });
      }

      function _send(payload, once) {
        return new Promise(resolve => {
          wss.send(JSON.stringify(payload));
          promise = {
            once,
            call: resolve
          };
        });
      }

      async function PixNovaConvert(imageBuffer) {
        const base64 = imageBuffer.toString("base64");
        await _connect();
        await _send({
          session_hash: SESSION
        }, true);
        const payload = {
          data: {
            source_image: `data:image/jpeg;base64,${base64}`,
            strength: 0.6,
            prompt: "toanime",
            negative_prompt: "",
            request_from: 2
          }
        };
        const response = await _send(payload, false);
        return response.output.result[0]; // URL hasil anime
      }

      try {
        const photo = xy.message.photo || xy.message.reply_to_message.photo;
        const fileId = photo[photo.length - 1].file_id;
        const file = await xy.api.getFile(fileId);

        if (!file || !file.file_path) {
          return reply("❌ Gagal mengambil gambar dari Telegram.");
        }

        const photoUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;


        const res = await axios.get(photoUrl, {
          responseType: 'arraybuffer'
        });
        const inputPath = './tmp_input.jpg';
        fs.writeFileSync(inputPath, res.data);

        const animeUrl = await PixNovaConvert(res.data);


        await xy.api.sendPhoto(xy.chat.id, animeUrl, {
          caption: "🎨 Foto berhasil diubah jadi anime!"
        });

        fs.unlinkSync(inputPath);

      } catch (err) {
        console.error("❌ Gagal mengubah foto:", err.message);
        reply("❌ Terjadi kesalahan saat mengubah foto jadi anime.");
      }

      break;
    }

      case "owner":
      const ownerId = global.idowner; // fallback ID
      await reply(`👤 Kontak Owner: [klik di sini](tg://user?id=${ownerId})`, {
        parse_mode: "Markdown"
      });
      break;
      
          case "setprefix":
    if (!isOwner) return reply(mess.owner)

    if (!q[0]) {
        return await reply(`⚙️ Setting Prefix

📝 Prefix saat ini: ${global.prefix}

💡 Cara penggunaan:
• ${global.prefix}setprefix ! - Ganti prefix jadi !
• ${global.prefix}setprefix # - Ganti prefix jadi #
• ${global.prefix}setprefix / - Ganti prefix jadi /

⚠️ Catatan:
• Prefix hanya bisa 1 karakter
• Setelah diganti, gunakan prefix baru untuk command`);
    }

    const newPrefix = q[0];
    
    if (newPrefix.length > 1) {
        return await reply(`❌ *Error!*

🚫 Prefix hanya boleh 1 karakter saja
💡 Contoh: \`.\` \`!\` \`#\` \`/\`

📝 *Prefix saat ini:* \`${global.prefix}\``);
    }

    const oldPrefix = global.prefix;
    
    global.prefix = newPrefix;    
    
    try {
        const configPath = path.join(__dirname, 'settings.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        configContent = configContent.replace(
            /global\.prefix = ["'].+?["']/g,
            `global.prefix = "${newPrefix}"`
        );
        
        fs.writeFileSync(configPath, configContent, 'utf8');
        
        await reply(`✅ *Prefix berhasil diubah!*

🔄 *Perubahan:*
• Prefix lama: \`${oldPrefix}\`
• Prefix baru: \`${newPrefix}\`

💡 *Contoh penggunaan:*
• \`${newPrefix}menu\` - Menampilkan menu

⚠️ *Penting:*
Sekarang gunakan prefix \`${newPrefix}\` untuk semua command!`);
        
    } catch (error) {
        console.error('Error updating config.js:', error);
        
        await reply(`⚠️ *Prefix berhasil diubah sementara!*

🔄 *Perubahan:*
• Prefix lama: \`${oldPrefix}\`
• Prefix baru: \`${newPrefix}\`

❌ *Warning:*
Gagal menyimpan ke config.js
Prefix akan kembali ke \`${oldPrefix}\` setelah restart bot

💡 *Solusi:*
Ubah manual di config.js atau restart bot`);
    }
    break;
    
case "tarik": {
  if (!isOwner) return reply(mess.owner);
  if (!text) return reply("Format salah!\nContoh:\n/tarik DANA1,0852xxxxxxx\n/tarik list");

  if (text.toLowerCase() === "list") {
    const textnyo = "*💳 Pilih layanan e-wallet yang ingin kamu lihat:*";
    await xy.api.sendMessage(xy.chat.id, textnyo, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔵 DANA", callback_data: "lihat_dana" }],
          [{ text: "🟢 GOPAY", callback_data: "lihat_gopay" }],
          [{ text: "🟣 OVO", callback_data: "lihat_ovo" }],
          [{ text: "🔙 Kembali", callback_data: "kembali_menu" }]
        ]
      }
    });
    return;
  }

  if (!text.includes(",")) return reply("Format salah!\nContoh: /tarik DANA1,0852xxxxxxx");

  let [kode, nomor] = text.split(",").map(x => x.trim());
  if (!kode || !nomor || isNaN(nomor)) return reply("Format salah!\nPastikan hanya angka untuk nomor.");

  const h2hkey = apikeyhost;
  const reff_id = Math.floor(Math.random() * 100000000);

  try {
    const orderRes = await axios("https://atlantich2h.com/transaksi/create", {
      method: "POST",
      data: new URLSearchParams({
        api_key: h2hkey,
        code: kode,
        reff_id,
        target: nomor
      })
    });

    const r = orderRes.data;
    if (!r.status) {
      return reply(`❌ Gagal: ${r.message || "Tidak diketahui."}`);
    }

    return reply(
`✅ Transaksi Berhasil!

🛒 Kode: ${kode}
📱 Tujuan: ${nomor}
🆔 ID Transaksi: ${reff_id}
📦 Status: ${r.data.status}
🕒 Waktu: ${r.data.created_at}

Terima kasih!`
    );

  } catch (err) {
    if (err.response) {
      const code = err.response.status;
      if (code === 503) return reply("❌ Gagal: Stok sedang habis, coba nanti.");
      if (code === 403) return reply("❌ Gagal: Saldo penyedia tidak mencukupi.");
    }

    console.error(err);
    return reply("❌ Terjadi kesalahan saat memproses transaksi.");
  }
}
break;
      
      case "saldo":
case "cek": {
if (!isOwner) return reply(mess.owner)
  try {
    const response = await axios("https://atlantich2h.com/get_profile", {
      method: "POST",
      data: new URLSearchParams({
        api_key: apikeyhost
      })
    });

    const res = response.data;
    if (!res.status || !res.data) {
      return reply("❌ Gagal mengambil data profil.");
    }

    const { name, username, balance, status } = res.data;

    return reply(
`💼 Informasi Akun

👤 Nama: ${name}
🆔 Username: ${username}
💰 Saldo: Rp${Number(balance).toLocaleString("id-ID")}
📌 Status: ${status}`
    );

  } catch (err) {
    console.error(err);
    return reply("❌ Terjadi kesalahan saat mengambil data saldo.");
  }
}
break
    /*case 'play':
    case 'ytmp3': {
      if (!q) return reply(`*Kirim query atau link YouTube!* ${prefix + command}`);
      
      try {
        async function searchYouTube(query) {
          const axios = require('axios');
          const res = await axios.get('https://www.youtube.com/results', {
            params: { search_query: query },
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const videoId = res.data.match(/"videoId":"(.*?)"/)?.[1];
          if (!videoId) throw 'Video tidak ditemukan';
          return `https://www.youtube.com/watch?v=${videoId}`;
        }

        async function ssvidDownloader(url) {
          const axios = require('axios');
          const qs = require('qs');
          if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) throw 'URL tidak valid';
          
          const res = await axios.post(
            'https://ssvid.net/api/ajax/search',
            qs.stringify({ query: url, vt: 'home' }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
              }
            }
          );

          const data = res.data;
          if (!data || data.status !== 'ok') throw 'Gagal mengambil data video';
          
          const { title, a: author, t: duration, vid } = data;
          
          const audioFormats = data.links?.mp3 || {};
          const selectedAudio = Object.values(audioFormats)[0];
          if (!selectedAudio || !selectedAudio.k) throw 'Tidak ada format audio yang tersedia';
          
          const conv = await axios.post(
            'https://ssvid.net/api/ajax/convert',
            qs.stringify({ vid, k: selectedAudio.k }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://ssvid.net/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)'
              }
            }
          );
          
          const converted = conv.data;
          const downloadUrl = converted?.url || converted?.dlink;
          if (!downloadUrl) throw 'Gagal mengonversi audio';
          
          return {
            title,
            author,
            duration,
            downloadUrl
          };
        }

        let hasil;
        
        if (command === 'play') {
          const link = await searchYouTube(q);
          hasil = await ssvidDownloader(link);
        } else {
          if (!q.includes('youtu')) return reply('Masukkan URL YouTube yang valid');
          hasil = await ssvidDownloader(q);
        }

        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');
        
        const fileName = `${hasil.title.replace(/[^\w\s]/gi, '')}.mp3`;
        const filePath = path.join('./temp', fileName);
        
        if (!fs.existsSync('./temp')) {
          fs.mkdirSync('./temp', { recursive: true });
        }
        
        const response = await axios({
          method: 'GET',
          url: hasil.downloadUrl,
          responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await xy.api.sendAudio(xy.chat.id, new InputFile(filePath), {
          caption: `🎵 *${hasil.title}*\n👤 ${hasil.author}\n⏱️ ${hasil.duration}`,
          title: hasil.title,
          performer: hasil.author
        });
        
        fs.unlinkSync(filePath);
        
      } catch (err) {
        console.error("YouTube Audio Error:", err);
        reply("❌ Gagal download audio YouTube.");
      }
      
      break;
    }

    case 'ytmp4': {
      if (!q) return reply(`*Kirim link YouTube!* ${prefix + command}`);
      if (!q.includes('youtu')) return reply('Masukkan URL YouTube yang valid');
      
      try {
        async function ssvidDownloader(url) {
          const axios = require('axios');
          const qs = require('qs');
          if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) throw 'URL tidak valid';
          
          const res = await axios.post(
            'https://ssvid.net/api/ajax/search',
            qs.stringify({ query: url, vt: 'home' }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
              }
            }
          );

          const data = res.data;
          if (!data || data.status !== 'ok') throw 'Gagal mengambil data video';
          
          const { title, a: author, t: duration, vid } = data;
          
          const videoFormats = data.links?.mp4 || {};
          let selectedVideo = Object.values(videoFormats).find(v => v.q_text.includes('360p')) || Object.values(videoFormats)[0];
          if (!selectedVideo || !selectedVideo.k) throw 'Tidak ada format video yang tersedia';
          
          const conv = await axios.post(
            'https://ssvid.net/api/ajax/convert',
            qs.stringify({ vid, k: selectedVideo.k }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://ssvid.net/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)'
              }
            }
          );
          
          const converted = conv.data;
          const downloadUrl = converted?.url || converted?.dlink;
          if (!downloadUrl) throw 'Gagal mengonversi video';
          
          return {
            title,
            author,
            duration,
            quality: selectedVideo.q_text,
            downloadUrl
          };
        }

        const hasil = await ssvidDownloader(q);
        
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');
        
        const fileName = `${hasil.title.replace(/[^\w\s]/gi, '')}.mp4`;
        const filePath = path.join('./temp', fileName);
        
        if (!fs.existsSync('./temp')) {
          fs.mkdirSync('./temp', { recursive: true });
        }
        
        const response = await axios({
          method: 'GET',
          url: hasil.downloadUrl,
          responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await xy.api.sendVideo(xy.chat.id, new InputFile(filePath), {
          caption: `🎬 *${hasil.title}*\n👤 ${hasil.author}\n⏱️ ${hasil.duration}\n📺 ${hasil.quality}`
        });
        
        fs.unlinkSync(filePath);
        
      } catch (err) {
        console.error("YouTube Video Error:", err);
        reply("❌ Gagal download video YouTube.");
      }
      
      break;
    }*/

    default:

  }
}


module.exports = {
  handleMessage
};