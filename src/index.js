// ОТЛАДОЧНЫЙ КОД
console.log('=== STARTING BOT ===');
console.log('Node version:', process.version);
console.log('BOT_TOKEN from env:', process.env.BOT_TOKEN ? 'EXISTS' : 'MISSING!');

// Временные заглушки для функций работы с базой данных
async function saveUser(userId, userData) {
  console.log('Заглушка saveUser: сохраняем пользователя', userId, userData);
  return true;
}

async function getUser(userId) {
  console.log('Заглушка getUser: получаем пользователя', userId);
  return {
    telegramId: userId,
    firstName: 'Test User',
    username: 'testuser',
    joined: new Date().toISOString()
  };
}

// ОСНОВНОЙ КОД БОТА
const { Telegraf } = require('telegraf');

// ПРОВЕРКА ТОКЕНА
if (!process.env.BOT_TOKEN) {
  console.error('❌ CRITICAL ERROR: BOT_TOKEN is required!');
  console.error('Please set BOT_TOKEN environment variable in Amvera settings');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('✅ Bot instance created with token');

// ... остальной ваш код без изменений ...
  // РћС‚РїСЂР°РІР»СЏРµРј СЃРѕРѕР±С‰РµРЅРёРµ СЃ РёРЅР»Р°Р№РЅ-РєРЅРѕРїРєР°РјРё "РЎРѕРіР»Р°СЃРµРЅ" Рё "РќРµ СЃРѕРіР»Р°СЃРµРЅ"
  ctx.reply(consentMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "вњ… РЎРѕРіР»Р°СЃРµРЅ", callback_data: "consent_given" },
          { text: "вќЊ РќРµ СЃРѕРіР»Р°СЃРµРЅ", callback_data: "consent_denied" }
        ]
      ]
    }
  });
});

// РћР±СЂР°Р±РѕС‚С‡РёРє РЅР°Р¶Р°С‚РёСЏ РЅР° РєРЅРѕРїРєСѓ СЃРѕРіР»Р°СЃРёСЏ
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === 'consent_given') {
    // РўРѕР»СЊРєРѕ РїРѕСЃР»Рµ РїРѕР»СѓС‡РµРЅРёСЏ СЃРѕРіР»Р°СЃРёСЏ СЃРѕС…СЂР°РЅСЏРµРј РґР°РЅРЅС‹Рµ
    const user = ctx.from;
    try {
      await saveUser(user.id, {
        firstName: user.first_name,
        username: user.username,
        joined: new Date().toISOString(),
        consentGiven: true, // РЎРѕС…СЂР°РЅСЏРµРј С„Р°РєС‚ РїРѕР»СѓС‡РµРЅРёСЏ СЃРѕРіР»Р°СЃРёСЏ
        consentDate: new Date().toISOString() // Рё РґР°С‚Сѓ
      });
      ctx.editMessageText("РЎРїР°СЃРёР±Рѕ! РўРµРїРµСЂСЊ РІС‹ РјРѕР¶РµС‚Рµ РїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ Р±РѕС‚РѕРј. РСЃРїРѕР»СЊР·СѓР№С‚Рµ /menu РґР»СЏ РіР»Р°РІРЅРѕРіРѕ РјРµРЅСЋ.");
    } catch (error) {
      console.error('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ:', error);
      ctx.editMessageText("РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё РІР°С€РёС… РґР°РЅРЅС‹С…. РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РїРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.");
    }
    ctx.answerCbQuery();
  } else if (data === 'consent_denied') {
    ctx.editMessageText("Р’С‹ РЅРµ РґР°Р»Рё СЃРѕРіР»Р°СЃРёРµ РЅР° РѕР±СЂР°Р±РѕС‚РєСѓ РґР°РЅРЅС‹С…. Рљ СЃРѕР¶Р°Р»РµРЅРёСЋ, С„СѓРЅРєС†РёРѕРЅР°Р» Р±РѕС‚Р° РІР°Рј РЅРµРґРѕСЃС‚СѓРїРµРЅ.");
    ctx.answerCbQuery();
  } else if (data.startsWith('category_')) {
    // РћР±СЂР°Р±РѕС‚С‡РёРє РІС‹Р±РѕСЂР° РєР°С‚РµРіРѕСЂРёРё (СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ С„СѓРЅРєС†РёРѕРЅР°Р»)
    ctx.reply(`Р’С‹ РІС‹Р±СЂР°Р»Рё: ${data.split('_')[1]}. Р­С‚Р° С„СѓРЅРєС†РёСЏ РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ.`);
    ctx.answerCbQuery();
  }
});

// РћР±СЂР°Р±РѕС‚С‡РёРє РєРѕРјР°РЅРґС‹ /profile
bot.command('profile', async (ctx) => {
  try {
    // РСЃРїРѕР»СЊР·СѓРµРј РЅРѕРІСѓСЋ С„СѓРЅРєС†РёСЋ getUser, РєРѕС‚РѕСЂР°СЏ СЂР°Р±РѕС‚Р°РµС‚ СЃ Back4app
    const userData = await getUser(ctx.from.id);
    if (userData) {
      ctx.reply(`Р’Р°С€ РїСЂРѕС„РёР»СЊ:\nID: ${userData.telegramId}\nРРјСЏ: ${userData.firstName}\nUsername: @${userData.username}\nР—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ: ${new Date(userData.joined).toLocaleDateString()}`);
    } else {
      ctx.reply('РџСЂРѕС„РёР»СЊ РЅРµ РЅР°Р№РґРµРЅ. РћС‚РїСЂР°РІСЊС‚Рµ /start РґР»СЏ СЂРµРіРёСЃС‚СЂР°С†РёРё.');
    }
  } catch (error) {
    console.error('РћС€РёР±РєР° РІ /profile:', error);
    ctx.reply('РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё РїСЂРѕС„РёР»СЏ.');
  }
});

// РЎРѕР·РґР°РµРј РіР»Р°РІРЅРѕРµ РјРµРЅСЋ
bot.command('menu', (ctx) => { 
  ctx.reply('Р’С‹Р±РµСЂРёС‚Рµ РґРµР№СЃС‚РІРёРµ:', { 
    reply_markup: { 
      keyboard: [ 
        ['рџ“„ РЎРѕР·РґР°С‚СЊ РґРѕРєСѓРјРµРЅС‚'],
        ['рџ“‹ РњРѕРё Р·Р°РєР°Р·С‹', 'рџ‘¤ РњРѕР№ РїСЂРѕС„РёР»СЊ'],
        ['вќ“ РџРѕРјРѕС‰СЊ', 'рџ“ћ РџРѕРґРґРµСЂР¶РєР°']
      ], 
      resize_keyboard: true 
    } 
  }); 
});

// РћР±СЂР°Р±РѕС‚С‡РёРє РєРЅРѕРїРєРё "РЎРѕР·РґР°С‚СЊ РґРѕРєСѓРјРµРЅС‚" 
bot.hears('рџ“„ РЎРѕР·РґР°С‚СЊ РґРѕРєСѓРјРµРЅС‚', (ctx) => { 
  ctx.reply('Р’С‹Р±РµСЂРёС‚Рµ С‚РёРї РґРѕРєСѓРјРµРЅС‚Р°:', { 
    reply_markup: { 
      inline_keyboard: [ 
        [ 
          { text: 'РџСЂРµС‚РµРЅР·РёРё', callback_data: 'category_claim' }, 
          { text: 'Р–Р°Р»РѕР±С‹', callback_data: 'category_complaint' } 
        ], 
        [ 
          { text: 'РҐРѕРґР°С‚Р°Р№СЃС‚РІР°', callback_data: 'category_petition' }, 
          { text: 'РСЃРєРѕРІС‹Рµ Р·Р°СЏРІР»РµРЅРёСЏ', callback_data: 'category_lawsuit' } 
        ] 
      ] 
    } 
  }); 
});

// Р—Р°РїСѓСЃРєР°РµРј Р±РѕС‚Р° 
bot.launch().then(() => { 
  console.log('Р‘РѕС‚ СѓСЃРїРµС€РЅРѕ Р·Р°РїСѓС‰РµРЅ!'); 
});

// РџСЂР°РІРёР»СЊРЅРѕ Р·Р°РІРµСЂС€Р°РµРј СЂР°Р±РѕС‚Сѓ РїСЂРё РѕСЃС‚Р°РЅРѕРІРєРµ 
process.once('SIGINT', () => bot.stop('SIGINT')); 
process.once('SIGTERM', () => bot.stop('SIGTERM'));
