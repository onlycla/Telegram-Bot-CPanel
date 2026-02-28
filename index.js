require('./config/settings')
require('./src/lib/menu')
const fs = require('fs');
const path = require('path');
const {
  Bot,
  Markup,
  InlineKeyboard,
  InputFile
} = require("grammy");
const ora = require('ora');
const axios = require('axios');
const readlineSync = require('readline-sync');
const {
  handleMessage
} = require("./config/CLA");
const connectwa = require("./src/lib/connectwa");
const {
  setBotInstance,
  restoreWhatsAppSessions
} = require('./src/lib/connectwa');

const tokenPath = path.join(__dirname, './src/database/token.json');
const warnFile = path.join(__dirname, "./src/database/warns.json");


function getUserStatus(userId) {
  const userIdStr = String(userId); // Samakan tipe string
  const ownerList = JSON.parse(fs.readFileSync("./owner.json"));
  const sellerList = JSON.parse(fs.readFileSync("./src/database/seller.json"));

  if (ownerList.includes(userIdStr)) return "👑 Owner";

  const isSeller = sellerList.find(seller => seller.id === userIdStr);
  if (isSeller) return "📦 Reseller";

  return "👤 User Biasa";
}

global.startTime = Date.now();

function formatDuration(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / (1000 * 60)) % 60;
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));

  return `${d} hari ${h} jam ${m} menit ${s} detik`;
}

function readWarnDB() {
  try {
    if (fs.existsSync(warnFile)) {
      return JSON.parse(fs.readFileSync(warnFile, "utf8"));
    }
    return {}; // Jika file tidak ada, kembalikan objek kosong
  } catch (error) {
    console.error("❌ Error membaca warnDB:", error);
    return {}; // Jika terjadi error, kembalikan objek kosong agar tidak crash
  }
}

function saveWarnDB(data) {
  try {
    fs.writeFileSync(warnFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error menyimpan warnDB:", error);
  }
}

let warnDB = readWarnDB();
let pendingWarns = new Map();

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function askToken() {
  console.log('🔑 Masukkan Token Bot Telegram:');
  return readlineSync.question('> ').trim();
}

function getToken() {
  if (fs.existsSync(tokenPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
      if (data.token && data.token.trim() !== '') {
        return data.token.trim();
      }
    } catch (err) {
      console.log('⚠️ Gagal membaca token.json, meminta token baru...');
    }
  }

  const token = askToken();

  if (!token) {
    console.log('❌ Token kosong! Program dihentikan.');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(tokenPath), {
    recursive: true
  });
  fs.writeFileSync(tokenPath, JSON.stringify({
    token
  }, null, 2));
  console.log('✅ Token berhasil disimpan!');

  return token;
}

const botToken = getToken();
const bot = new Bot(botToken);


function loadUsers() {
  if (!fs.existsSync("./src/database/user.json")) return [];
  return JSON.parse(fs.readFileSync("./src/database/user.json", "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync("./src/database/user.json", JSON.stringify(users, null, 2));
}

setBotInstance(bot);


bot.command("start", async (CLA) => {
  const userId = CLA.from.id;
  const users = new Set(loadUsers());
  users.add(userId);
  saveUsers([...users]);

  await CLA.api.sendMessage(CLA.chat.id,
    'Hallo Selamat Datang di bot Cpanel\n\nSilahkan Menikmati :)', {
      reply_markup: {
        inline_keyboard: [
          [{
            text: 'Info Script',
            callback_data: 'script'
          }, {
            text: 'Owner',
            callback_data: 'owner'
          }],
          [{
            text: 'Buka Menu',
            callback_data: 'mainmenu'
          }]
        ]
      }
    }
  );
});

bot.callbackQuery("owner", async (ctx) => {
  await ctx.answerCallbackQuery();

  const ownerId = global.idowner;
  await ctx.reply(`👤 Kontak Owner: [klik di sini](tg://user?id=${ownerId})`, {
    parse_mode: "Markdown"
  });
});

bot.callbackQuery("script", async (ctx) => {
  await ctx.answerCallbackQuery(); 

  await ctx.reply("📄 *Info Script:*\nhttps://github.com/onlycla", {
    parse_mode: "Markdown"
  });
});

function getMainMenuKeyboard() {
  return new InlineKeyboard()
    .text("🎉 Special Menu", "specialmenu").row()
    .text("📌 Owner Menu", "ownermenu").row()
    .text("🛠️ Tools Menu", "toolsmenu").row()
    .text("📥 Downloader Menu", "downloadermenu").row()
    .text("🛒 Reseller Panel", "resellerpanel").row()
    .text("🖥️ CPanel Owner", "cpanelowner").row()
    .text("🛍️ Store Menu", "storemenu").row()
    .text("🎛️ Installer Panel", "installermenu").row()
    .text("👥 Group Menu", "groupmenu");
}

async function sendMainMenu(ctx) {
  const uptime = formatDuration(Date.now() - global.startTime);

const info = `
🤖 *INFO BOT*

• Nama Bot: ${namabot}
• Status Kamu: ${getUserStatus(ctx.from.id)}
• ID Kamu: ${ctx.from.id}
• Username: @${ctx.from.username || "-"}
• Versi Bot: 2.0.0
• Aktif Sejak: ${uptime}
• Dibuat Oleh: [Developer](tg://user?id=isi_userid)

🔘 Silakan pilih menu:
`;

  try {
    if (ctx.update.message) {
      await ctx.reply(info, {
        parse_mode: "Markdown",
        reply_markup: getMainMenuKeyboard(),
      });
    }

    if (ctx.update.callback_query) {
      await ctx.editMessageText(info, {
        parse_mode: "Markdown",
        reply_markup: getMainMenuKeyboard(),
      });
    }
  } catch (error) {
    console.error("❌ Gagal kirim menu utama:", error);
  }
}

const menus = {
  specialmenu: specialmenu,
  ownermenu: ownermenu,
  toolsmenu: toolsmenu,
  downloadermenu: downloadermenu,
  resellerpanel: resellerpanel,
  cpanelowner: cpanelowner,
  storemenu: storemenu,
  installermenu: installermenu,
  groupmenu: groupmenu,
};

bot.command("menu", sendMainMenu);

for (const key in menus) {
  bot.callbackQuery(key, async (ctx) => {
    try {
      await ctx.editMessageText(menus[key], {
        parse_mode: "Markdown",
        reply_markup: new InlineKeyboard().text("⬅️ Kembali", "mainmenu"),
      });
    } catch (error) {
      console.error(`❌ Gagal buka menu ${key}:`, error);
    }
  });
}

bot.callbackQuery("mainmenu", async (ctx) => {
  await sendMainMenu(ctx);
});

const spinner = ora({
  text: 'Menghubungkan bot...',
  spinner: 'bouncingBar'
}).start();

function animateWaitingText() {
  let dots = '';
  return setInterval(() => {
    dots = dots.length < 3 ? dots + '.' : '';
    process.stdout.write(`\r⌛ Menunggu pesan${dots} `);
  }, 500);
}

bot.api.getMe().then((me) => {
  console.clear();
  console.log("==================================");
  spinner.succeed("✅ Bot berhasil terhubung!");
  console.log(`🤖 Nama Bot  : ${me.first_name}`);
  console.log(`📛 Username  : @${me.username}`);
  console.log("▶️ Bot aktif dan siap menerima perintah");
  console.log("==================================");

  animateWaitingText(); // mulai animasi

  (async () => {
    await connectwa.restoreWhatsAppSessions();
    console.log("✅ Semua sesi berhasil direstore. Bot siap digunakan.");
  })();
  bot.start();
}).catch((err) => {
  console.error("❌ Gagal menghubungkan bot:", err.message);
  process.exit(1);
});

bot.on("message:new_chat_members", async (ctx) => {
  const groupID = ctx.chat.id;
  let listData = [];
  try {
    listData = JSON.parse(fs.readFileSync('./src/database/weleave.json', 'utf8'));
  } catch (e) {}

  const found = listData.find(item => item.id === groupID);
  if (!found || !found.welcome) return; // ⛔ Jangan kirim kalau tidak diaktifkan

  for (const user of ctx.message.new_chat_members) {
    const name = user.first_name || "Pengguna";
    await ctx.reply(`👋 Selamat datang, *${name}*!`, {
      parse_mode: "Markdown"
    });
  }
});

bot.on("message:left_chat_member", async (ctx) => {
  const groupID = ctx.chat.id;
  let listData = [];
  try {
    listData = JSON.parse(fs.readFileSync('./src/database/weleave.json', 'utf8'));
  } catch (e) {}

  const found = listData.find(item => item.id === groupID);
  if (!found || !found.leave) return; // ⛔ Jangan kirim kalau tidak diaktifkan

  const name = ctx.message.left_chat_member?.first_name || "Pengguna";
  await ctx.reply(`👋 Selamat tinggal, *${name}*!`, {
    parse_mode: "Markdown"
  });
});


bot.on("message", async (ctx, next) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const entities = ctx.message.entities;

  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") return next();

  const listData = JSON.parse(fs.readFileSync("./src/database/antilink.json", "utf8"));

  const groupData = listData.find((item) => item.id === chatId);
  if (!groupData || !groupData.antilink) return next();

  const admins = await ctx.getChatAdministrators();
  const isAdmin = admins.some((a) => a.user.id === userId);
  if (isAdmin) return next();

  let containsLink = /(https?:\/\/[^\s]+)/.test(text);
  if (entities && Array.isArray(entities)) {
    for (let entity of entities) {
      if (entity.type === "url" || entity.type === "text_link") {
        containsLink = true;
        break;
      }
    }
  }

  if (!containsLink) return next();

  let warningData = JSON.parse(fs.readFileSync("./src/database/warningData.json", "utf8") || "{}");
  if (!warningData[chatId]) warningData[chatId] = {};
  if (!warningData[chatId][userId]) warningData[chatId][userId] = 0;

  warningData[chatId][userId]++;

  try {
    await ctx.api.deleteMessage(chatId, ctx.message.message_id);
  } catch (err) {
    console.error("Gagal hapus pesan:", err);
  }

  if (warningData[chatId][userId] < 3) {
    await ctx.reply(`⚠️ *Peringatan ${warningData[chatId][userId]}/3!* ${ctx.from.first_name}, jangan kirim link!`, {
      parse_mode: "Markdown",
    });
  } else {
    try {
      const muteUntil = Math.floor(Date.now() / 1000) + 3 * 3600;
      await ctx.restrictChatMember(userId, {
        permissions: {
          can_send_messages: false,
        },
        until_date: muteUntil,
      });
      await ctx.reply(`🚨 ${ctx.from.first_name} telah mencapai 3 pelanggaran dan di-mute 3 jam.`);
      warningData[chatId][userId] = 0;
    } catch (e) {
      console.error("Gagal mute:", e);
    }
  }

  fs.writeFileSync("./src/database/warningData.json", JSON.stringify(warningData, null, 2));

  function getGroupSettings(groupID) {
    try {
      let listData = JSON.parse(fs.readFileSync("./src/database/weleave.json", "utf8"));
      let group = listData.find((item) => item.id === groupID);
      return group || {
        welcome: false,
        leave: false
      };
    } catch (error) {
      console.error("Gagal membaca pengaturan grup:", error);
      return {
        welcome: false,
        leave: false
      };
    }
  }
});

bot.on("message", async (CLA) => { // Tambahkan async di sini
  const msg = CLA.message

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);

  const user = CLA.from;
  const nama = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const username = user.username ? `@${user.username}` : '(tanpa username)';
  const waktu = new Date().toLocaleTimeString();

  console.log(`⏰ ${waktu}`);
  console.log(`🆔 Id : ${user.id}`)
  console.log(`📩 Dari     : ${username} (${nama})`);
  console.log(`📝 Pesan    : ${msg.text}`);
  console.log("==================================");


  const seller = JSON.parse(fs.readFileSync('./src/database/seller.json'));
  const sellerPath = './src/database/seller.json';
  const owners = JSON.parse(fs.readFileSync('./owner.json', 'utf8'));
  const db_respon_list = JSON.parse(fs.readFileSync('./src/database/list.json'));

  const isOwner = owners.includes(String(CLA.from.id));

  const now = Date.now();

  const validSellers = seller.filter(item => item.expiresAt > now);

  const {
    CatBox,
    fileIO,
    pomfCDN
  } = require('./src/lib/uploader');

  if (validSellers.length !== seller.length) {
    fs.writeFileSync(sellerPath, JSON.stringify(validSellers, null, 2));
  }

  const isSeller = validSellers.some(item =>
    item.id === String(CLA.from.id)
  );

  const isGroup = ['group', 'supergroup'].includes(CLA.chat.type);

  const groupName = isGroup ? CLA.chat.title : "";
  const groupId = isGroup ? CLA.chat.id : "";

  let groupAdmins = [];
  let isGroupAdmins = false;
  let isBotGroupAdmins = false;

  if (isGroup) {
    const participants = await CLA.getChatAdministrators();
    groupAdmins = participants.map(admin => admin.user.id);
    isGroupAdmins = groupAdmins.includes(CLA.from.id);

    const botId = CLA.me.id;
    isBotGroupAdmins = groupAdmins.includes(botId);
  }

  const reply = (teks) => CLA.reply(teks);

  function generateReadableString(length) {
    const words = ["sky", "cloud", "wind", "fire", "storm", "light", "wave", "stone", "shadow", "earth"];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900); // 3-digit number
    return randomWord + randomNumber;
  }



  let body = msg.text ||
    msg.caption ||
    msg.document?.file_name ||
    msg.video?.file_name ||
    msg.audio?.file_name ||
    msg.voice && '[Voice Message]' ||
    msg.sticker && '[Sticker]' ||
    msg.animation && '[GIF]' ||
    msg.photo && '[Photo]' ||
    msg.contact && '[Contact]' ||
    msg.location && '[Location]' ||
    msg.venue && '[Venue]' ||
    msg.poll && '[Poll]' ||
    "";

  const command = body.startsWith(prefix) ?
    body.slice(prefix.length).trim().split(" ")[0].split("@")[0].toLowerCase() :
    "";
  const args = body.trim().split(/ +/).slice(1);
  const q = text = args.join(" ");

  const sender = CLA.message.chat.id

  if (body && CLA.chat && CLA.chat.type !== 'private') {
    let userInput = body.trim();

    let matchedProduct = db_respon_list.find(item =>
      item.id === CLA.chat.id &&
      item.key.toLowerCase() === userInput.toLowerCase()
    );

    if (matchedProduct) {
      if (matchedProduct.isImage && matchedProduct.image_url) {
        const response = await axios.get(matchedProduct.image_url, {
          responseType: "arraybuffer"
        });
        const imagePath = `./temp.jpg`;

        fs.writeFileSync(imagePath, response.data);

        await CLA.api.sendPhoto(CLA.chat.id, new InputFile(imagePath), {
          caption: `*${matchedProduct.key}*\n\n${matchedProduct.response}`,
          parse_mode: "Markdown"
        });

        fs.unlinkSync(imagePath);

      } else {
        reply(`*${matchedProduct.key}*\n\n${matchedProduct.response}`, {
          parse_mode: "Markdown"
        });
      }
    }
  }

  if (!global.groupMembers) {
    global.groupMembers = {};
  }

  if (CLA.message && CLA.message.from && CLA.message.chat && CLA.message.chat.type !== 'private') {
    const chatId = CLA.message.chat.id;
    const user = CLA.message.from;

    try {
      if (!global.groupMembers[chatId]) {
        global.groupMembers[chatId] = [];
      }

      const existingMemberIndex = global.groupMembers[chatId].findIndex(
        member => member.id === user.id
      );

      if (existingMemberIndex === -1) {
        global.groupMembers[chatId].push({
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          username: user.username || '',
          is_bot: user.is_bot || false,
          last_seen: new Date().toISOString()
        });


      } else {
        global.groupMembers[chatId][existingMemberIndex].last_seen = new Date().toISOString();
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      global.groupMembers[chatId] = global.groupMembers[chatId].filter(member => {
        const lastSeen = new Date(member.last_seen);
        return lastSeen > thirtyDaysAgo;
      });

    } catch (error) {
      console.error("Error auto-collecting member:", error);
    }
  }


  await handleMessage(CLA, command, sleep, isOwner, isSeller, reply, owners, seller, sellerPath, q, text, InlineKeyboard, paket, isGroupAdmins, mess, warnDB, saveWarnDB, pendingWarns, InputFile, botToken, CatBox, sender, db_respon_list, generateReadableString); // Memanggil handleMessage secara async

});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const userId = ctx.from.id;

  if (data.startsWith("cancel_warn_")) {
    try {
      const admins = await ctx.getChatAdministrators();
      const isAdmin = admins.some((admin) => admin.user.id === userId);
      if (!isAdmin) {
        return ctx.answerCallbackQuery({
          text: "❌ Hanya admin yang bisa membatalkan peringatan.",
          show_alert: true,
        });
      }
    } catch (e) {
      console.error("Gagal cek admin:", e);
      return ctx.answerCallbackQuery({
        text: "❌ Terjadi kesalahan saat memverifikasi admin.",
        show_alert: true,
      });
    }

    const warnedUserId = data.split("_")[2];
    if (!warnDB[warnedUserId] || warnDB[warnedUserId].length === 0) {
      return ctx.answerCallbackQuery({
        text: "⚠️ Tidak ada peringatan yang bisa dibatalkan.",
        show_alert: true,
      });
    }

    warnDB[warnedUserId].pop();
    saveWarnDB(warnDB);

    const warnCount = warnDB[warnedUserId].length;
    let updatedText = `⚠️ Peringatan telah diperbarui!\n📌 Total peringatan: ${warnCount}/3`;

    await ctx.editMessageText(updatedText, {
      reply_markup: warnCount > 0 ? {
        inline_keyboard: [
          [{
            text: "❌ Batalkan Peringatan",
            callback_data: `cancel_warn_${warnedUserId}`
          }]
        ]
      } : undefined
    });

    await ctx.answerCallbackQuery({
      text: "✅ Peringatan berhasil dibatalkan!",
      show_alert: true,
    });
  }
});