import puppeteer from "puppeteer";
import { validateUrl } from "./validation.js";

export const initializeBrowser = async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: "new",
    ignoreDefaultArgs: ["--disable-extensions"],
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browser;
};

const loadTweet = async (browser, url) => {
  if (!browser) await initializeBrowser();

  const page = await browser.newPage();

  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "dark" },
  ]);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });
  // The tweet was deleted :(
  if ((await page.$(`h1[data-testid="error-detail"]`)) !== null) {
    await browser.close();
    return;
  }
  await page.waitForSelector('article[role="article"]');
  return page;
};

export const extractUsername = async (browser, url) => {
  if (!validateUrl(url)) return;

  const page = await loadTweet(browser, url);

  if (!page) return;

  const userElement = await page.$(
    'div[data-testid="User-Name"] > div:nth-child(2) a span'
  );
  const userName = await page.evaluate((e) => e.innerText, userElement);
  await userElement.dispose();
  await page.close();

  return userName.slice(1);
};

export const screenshotTweet = async (browser, url) => {
  const page = await loadTweet(browser, url);
  if (!page) return;

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

  await page.close();
  return screenshot;
};
