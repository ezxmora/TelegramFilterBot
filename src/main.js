import { Telegraf } from "telegraf";
import {
  escapeMarkdown,
  extractTweetScreenshot,
  extractUsername,
} from "./util.js";
import fs from "fs";
import "dotenv/config";
let blacklist;

const bot = new Telegraf(process.env.BOT_TOKEN, { username: "McFarlaneBot" });

const findUrlInMessage = ({ message }) => {
  const { text, entities } = message;
  if (entities) {
    const messageType = entities.find(
      (v) => v.type == "url" || v.type == "text_link"
    );

    if (messageType?.type == "url") {
      return text
        .split(" ")
        .find((v) => v.includes("https://") || v.includes("http://"));
    }

    if (messageType?.type == "text_link") {
      return messageType.url;
    }
  }

  return;
};

const validateUrl = async (url) => {
  const twitterRegex = new RegExp(
    /(https|http)?:\/\/(x|twitter|fixupx|fxtwitter)?\.com\/(\w+)\/(status(?:es)?)\/(\d+)/gim
  );
  const isATweet = twitterRegex.exec(url);
  if (!isATweet) return false;

  const getRealUsername = await extractUsername(url);

  return blacklist[getRealUsername.toLowerCase()];
};

bot.command("blacklist", async (ctx) => {
  const { from } = ctx.message;
  const blacklistedUsers = Object.keys(blacklist)
    .map((i) => `- ${i}`)
    .join("\n");
  const outputText = escapeMarkdown(
    `Lista de cuentas censuradas:\n\n${blacklistedUsers}`
  );

  ctx.deleteMessage(ctx.message.id);
  ctx.telegram.sendMessage(from.id, outputText, { parse_mode: "MarkdownV2" });
});

bot.telegram.setMyCommands([
  { command: "blacklist", description: "Muestra la lista negra" },
]);

bot.on("message", async (ctx) => {
  const { from, text, message_id, chat } = ctx.message;
  if (!text?.length) return;

  const url = findUrlInMessage(ctx);
  if (!url) return;

  const processingTweet = await ctx.telegram.sendMessage(
    chat.id,
    "Procesando tweet... ⌛"
  );

  const validUrl = await validateUrl(url);

  if (validUrl) {
    const { username, first_name } = from;
    const screenshot = await extractTweetScreenshot(url);

    if (validUrl.show === 1) {
      ctx.sendPhoto(
        { source: Buffer.from(screenshot, "base64") },
        {
          has_spoiler: true,
          caption: `*${first_name}* ha pasado un tweet de un subnormal registrado\nEnlace al tweet: [tweet](${url})`,
          parse_mode: "MarkdownV2",
        }
      );
    } else {
      ctx.sendMessage(
        `*${first_name}* ha pasado un tweet de un subnormal registrado\nEnlace al tweet: [tweet](${url})`,
        {
          parse_mode: "MarkdownV2",
          link_preview_options: { is_disabled: true },
        }
      );
    }

    await ctx.deleteMessage(ctx.update.message.message_id);
    process.stdout.write(
      `DELETED ${message_id} - @${username} / ${first_name} - ${url}\n`
    );
  }
  await ctx.telegram.deleteMessage(
    processingTweet.chat.id,
    processingTweet.message_id
  );
});

bot.launch({ allowedUpdates: true }, () => {
  blacklist = JSON.parse(
    fs
      .readFileSync(`${process.cwd()}/blacklist.json`, { encoding: "utf-8" })
      .toLowerCase()
  );
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
