// Street Fighter 6 Character Usage Scraper
// This script scrapes character usage data using a headless browser

const puppeteer = require("puppeteer");

// ⚠️ IMPORTANT: Replace with environment variables in production
const CREDENTIALS = {
  email: "gonzalovarelasteam@gmail.com",
  password: "capcomGonz4lo1",
};

const CHARACTER_NAMES = [
  "Luke",
  "Jamie",
  "Manon",
  "Kimberly",
  "Marisa",
  "Lily",
  "JP",
  "Juri",
  "Dee Jay",
  "Cammy",
  "Ryu",
  "E. Honda",
  "Blanka",
  "Guile",
  "Ken",
  "Chun-Li",
  "Zangief",
  "Dhalsim",
  "Rashid",
  "A.K.I",
  "Ed",
  "Akuma",
  "Terry",
  "Mai",
  "Elena",
  "Bison",
];

async function scrapeSF6Data() {
  console.log("Starting Street Fighter 6 character usage scraping with Puppeteer...");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    // ⭐ FIX: Using a local Chrome installation to avoid launch errors
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
  });
  const page = await browser.newPage();

  try {
    console.log("Navigating directly to the CAPCOM ID login page...");
    await page.goto("https://cid.capcom.com/en/login/", {
      waitUntil: "networkidle2",
    });

    try {
      console.log("Checking for and dismissing cookie consent banner...");
      await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: 3000 });
      await page.click("#onetrust-accept-btn-handler");
      console.log("Cookie consent banner dismissed.");
    } catch (e) {
      console.log("No cookie consent banner found or an error occurred. Continuing...");
    }

    console.log("Attempting login with more resilient selectors...");
    
    await page.waitForSelector("input[type=email]", { visible: true, timeout: 10000 });
    await page.type("input[type=email]", CREDENTIALS.email);

    await page.waitForSelector("input[type=password]", { visible: true, timeout: 10000 });
    await page.type("input[type=password]", CREDENTIALS.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click("button[type=submit]"),
    ]);

    console.log("Navigating to rankings page...");
    await page.goto("https://www.streetfighter.com/6/buckler/ranking/master", {
      waitUntil: "networkidle2",
    });

    const rankingsHtml = await page.content();
    console.log("Successfully fetched rankings HTML.");

    const characterCounts = new Map();
    const characterWinrates = new Map();

    const patterns = [
      /<img[^>]+alt\s*=\s*["']([^"']*(?:Luke|Jamie|Manon|Kimberly|Marisa|Lily|JP|Juri|Dee Jay|Cammy|Ryu|E\. Honda|Blanka|Guile|Ken|Chun-Li|Zangief|Dhalsim|Rashid|A\.K\.I|Ed|Akuma|Terry|Mai|Elena|Bison)[^"']*)["'][^>]*>/gi,
      /data-character\s*=\s*["']([^"']+)["']/gi,
      /class\s*=\s*["'][^"']*(?:character|fighter)[^"']*["'][^>]*>([^<]*(?:Luke|Jamie|Manon|Kimberly|Marisa|Lily|JP|Juri|Dee Jay|Cammy|Ryu|E\. Honda|Blanka|Guile|Ken|Chun-Li|Zangief|Dhalsim|Rashid|A\.K\.I|Ed|Akuma|Terry|Mai|Elena|Bison)[^<]*)</gi,
    ];

    for (const pattern of patterns) {
      const matches = [...rankingsHtml.matchAll(pattern)];
      for (const match of matches) {
        const text = match[1] || match[0];
        for (const character of CHARACTER_NAMES) {
          if (text.toLowerCase().includes(character.toLowerCase())) {
            characterCounts.set(character, (characterCounts.get(character) || 0) + 1);
            break;
          }
        }
      }
    }

    const winratePatterns = [
      /<tr[^>]*>.*?(?:Luke|Jamie|Manon|Kimberly|Marisa|Lily|JP|Juri|Dee Jay|Cammy|Ryu|E\. Honda|Blanka|Guile|Ken|Chun-Li|Zangief|Dhalsim|Rashid|A\.K\.I|Ed|Akuma|Terry|Mai|Elena|Bison).*?(\d+).*?(\d+).*?(\d+\.?\d*)%.*?<\/tr>/gi,
      /(?:Luke|Jamie|Manon|Kimberly|Marisa|Lily|JP|Juri|Dee Jay|Cammy|Ryu|E\. Honda|Blanka|Guile|Ken|Chun-Li|Zangief|Dhalsim|Rashid|A\.K\.I|Ed|Akuma|Terry|Mai|Elena|Bison).*?Wins:\s*(\d+).*?Battles:\s*(\d+)/gi,
    ];

    for (const pattern of winratePatterns) {
      const matches = [...rankingsHtml.matchAll(pattern)];
      for (const match of matches) {
        const fullMatch = match[0];
        for (const character of CHARACTER_NAMES) {
          if (fullMatch.toLowerCase().includes(character.toLowerCase())) {
            const winsMatch = fullMatch.match(/(?:Wins?:?\s*|>)(\d+)(?:\s*\/|\s*<|$)/i);
            const battlesMatch = fullMatch.match(/(?:Battles?:?\s*|\/\s*)(\d+)(?:\s*<|$)/i);
            const winrateMatch = fullMatch.match(/(\d+\.?\d*)%/i);

            if (winsMatch && battlesMatch) {
              const wins = Number.parseInt(winsMatch[1]);
              const battles = Number.parseInt(battlesMatch[1]);

              if (!characterWinrates.has(character)) {
                characterWinrates.set(character, { wins: 0, battles: 0, playerCount: 0 });
              }
              const current = characterWinrates.get(character);
              current.wins += wins;
              current.battles += battles;
              current.playerCount += 1;
            } else if (winrateMatch) {
              const winrate = Number.parseFloat(winrateMatch[1]);
              if (!characterWinrates.has(character)) {
                characterWinrates.set(character, { wins: 0, battles: 0, playerCount: 0 });
              }
              const current = characterWinrates.get(character);
              current.playerCount += 1;
              if (current.battles === 0) {
                const estimatedBattles = 100;
                current.battles += estimatedBattles;
                current.wins += Math.round((winrate / 100) * estimatedBattles);
              }
            }
            break;
          }
        }
      }
    }

    const totalPlayers = Array.from(characterCounts.values()).reduce((a, b) => a + b, 0);

    if (totalPlayers === 0) {
      throw new Error("No character data found in rankings page");
    }

    const usage = Array.from(characterCounts.entries())
      .map(([character, count]) => ({
        character,
        count,
        percentage: (count / totalPlayers) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    const winrates = Array.from(characterWinrates.entries())
      .map(([character, data]) => ({
        character,
        winrate: data.battles > 0 ? (data.wins / data.battles) * 100 : 0,
        wins: data.wins,
        battles: data.battles,
        playerCount: data.playerCount,
      }))
      .filter((item) => item.battles > 0)
      .sort((a, b) => b.winrate - a.winrate);

    const scrapedData = {
      usage,
      winrates,
      scrapedPlayers: totalPlayers,
      lastScrapedRank: Math.min(totalPlayers, 400),
    };

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `sf6-data-${timestamp}.json`;
    const dataToSave = {
      ...scrapedData,
      timestamp: new Date().toISOString(),
      filename: filename,
    };

    console.log(`Saving data to ${filename}`);
    console.log("Scraped data:", JSON.stringify(dataToSave, null, 2));

    return dataToSave;

  } catch (error) {
    console.error("Scraping failed:", error.message);
    return {
      usage: [],
      winrates: [],
      scrapedPlayers: 0,
      lastScrapedRank: 0,
      failurePoint: error.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper
scrapeSF6Data()
  .then((result) => {
    console.log("Scraping completed!");
    console.log("Final result:", result);
  })
  .catch((error) => {
    console.error("Scraping failed:", error);
  });