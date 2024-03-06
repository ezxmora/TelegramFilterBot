import { Telegraf } from "telegraf";
import {
  initializeBrowser,
  extractUsername,
  screenshotTweet,
} from "./libs/browser.js";
import { escapeMarkdown, findUrl } from "./libs/validation.js";
import fs from "fs";
import "dotenv/config";
import { Logger } from "./libs/logger.js";
let blacklist, browser;

const bot = new Telegraf(process.env.BOT_TOKEN, { username: "McFarlaneBot" });
const logger = new Logger();

bot.telegram.setMyCommands([
  { command: "blacklist", description: "Muestra la lista negra" },
]);

bot.command("blacklist", async (ctx) => {
  const { from, message_id, chat } = ctx.message;

  try {
    const blacklistedUsers = Object.keys(blacklist)
      .map((i) => `- ${i}`)
      .join("\n");
    const outputText = escapeMarkdown(
      `Lista de cuentas censuradas:\n\n${blacklistedUsers}`
    );
    ctx.telegram.sendMessage(from.id, outputText, { parse_mode: "MarkdownV2" });
  } catch (e) {
    logger.error(
      "There was an error triying to send the blacklist to the user"
    );
    process.stderr.write(e);
  } finally {
    logger.log(
      `BLACKLIST @ ${chat.id} > ${message_id} - @${from.username} / ${from.first_name}`
    );
    ctx.deleteMessage(ctx.message.id);
  }
});

bot.on("message", async (ctx) => {
  const { from, text, message_id, chat } = ctx.message;
  if (!text?.length) return;

  const url = findUrl(ctx.message);
  if (!url) return;

  if (!browser) await initializeBrowser();

  const processingTweet = await ctx.telegram.sendMessage(
    chat.id,
    "Procesando tweet... ⌛"
  );

  const username = await extractUsername(browser, url);
  const isBlacklisted = blacklist[username.toLowerCase()];

  if (isBlacklisted) {
    const { username, first_name } = from;

    if (isBlacklisted.show === 1) {
      const screenshot = await screenshotTweet(browser, url);
      ctx.sendPhoto(
        { source: Buffer.from(screenshot, "base64") },
        {
          has_spoiler: true,
          caption: `*${first_name}* ha enviado un tweet de un subnormal registrado\n[Enlace al tweet](${url})`,
          parse_mode: "MarkdownV2",
        }
      );
    } else {
      ctx.sendMessage(
        `*${first_name}* ha enviado un tweet de un subnormal registrado\n[Enlace al tweet](${url})`,
        {
          parse_mode: "MarkdownV2",
          link_preview_options: { is_disabled: true },
        }
      );
    }

    await ctx.deleteMessage(ctx.update.message.message_id);
    logger.log(
      `DELETED @ ${chat.id} > ${message_id} - [@${username} / ${first_name}] > URL: ${url}\n`
    );
  }
  await ctx.telegram.deleteMessage(
    processingTweet.chat.id,
    processingTweet.message_id
  );
});

bot.launch({ allowedUpdates: true }, async () => {
  blacklist = JSON.parse(
    fs
      .readFileSync(`${process.cwd()}/blacklist.json`, { encoding: "utf-8" })
      .toLowerCase()
  );
  browser = await initializeBrowser();
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
