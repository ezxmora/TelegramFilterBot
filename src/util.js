import puppeteer from "puppeteer";

const loadTweet = async (url) => {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: "new",
    ignoreDefaultArgs: ["--disable-extensions"],
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "dark" },
  ]);
  await page.goto(url, { waitUntil: "networkidle0" });
  // The tweet was deleted :(
  if ((await page.$(`h1[data-testid="error-detail"]`)) !== null) {
    await browser.close();
    return;
  }
  await page.waitForSelector('article[role="article"]');
  return [browser, page];
};

export const extractUsername = async (url) => {
  const [browser, page] = await loadTweet(url);

  if (!page || !browser) return;

  const userElement = await page.$(
    'div[data-testid="User-Name"] > div:nth-child(2) a span'
  );
  const userName = await page.evaluate((e) => e.innerText, userElement);
  await userElement.dispose();
  await browser.close();

  return userName.slice(1);
};

export const extractTweetScreenshot = async (url) => {
  const [browser, page] = await loadTweet(url);
  if (!browser || !page) return;

  const tweet = await page.$('article[role="article"]');

  // Remove cookie banner & header
  await page.evaluate(() => {
    // target the sign in and cookie banner
    let headerElement = document.querySelector(
      'div[aria-label="Home timeline"] > div'
    );
    let bottomElement = document.querySelector("#layers > div");

    // remove these elements as we don't want them in the screenshot
    headerElement.parentNode.removeChild(headerElement);
    bottomElement.parentNode.removeChild(bottomElement);
  });

  const screenshot = await tweet.screenshot({
    optimizeForSpeed: true,
    encoding: "base64",
  });

  await browser.close();
  return screenshot;
};

const SPECIAL_CHARS = [
  "\\",
  "_",
  "*",
  "[",
  "]",
  "(",
  ")",
  "~",
  "`",
  ">",
  "<",
  "&",
  "#",
  "+",
  "-",
  "=",
  "|",
  "{",
  "}",
  ".",
  "!",
];

export const escapeMarkdown = (text) => {
  SPECIAL_CHARS.forEach((c) => (text = text.replaceAll(c, `\\${c}`)));

  return text;
};
