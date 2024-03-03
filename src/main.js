import { Telegraf, Telegram } from "telegraf";
import fs from "fs";
import "dotenv/config";

const bot = new Telegraf(process.env.BOT_TOKEN, { username: "McFarlaneBot" });
let blacklist;

const validateUrl = (url) => {
  const twitterRegex = new RegExp(
    /(https|http)?:\/\/(x|twitter|fixupx|fxtwitter)?\.com\/(\w+)\/(status(?:es)?)\/(\d+)/gim
  );
  const validUrl = twitterRegex.exec(url);

  if (!validUrl) return false;

  return blacklist.some((v) => v === validUrl[3].toLowerCase()) ? true : false;
};

bot.on("message", async (ctx) => {
  const { from, text, message_id, chat } = ctx.message;
  if (!text?.length) return;

  const splittedMessage = text.split(" ");
  const findUrl = splittedMessage.find((v) => v.includes("https://"));
  if (findUrl) {
    const validUrl = validateUrl(findUrl.toString());
    if (validUrl) {
      const { username, first_name } = from;

      try {
        process.stdout.write(
          `DELETED ${message_id} - @${username} / ${first_name} - ${findUrl}\n`
        );
        await ctx.telegram.sendMessage(
          chat.id,
          `¡Vaya ${first_name}! 😱\nParece que has pasado un tweet de un subnormal registrado.\nSi crees que ha sido un falso positivo contacta con el administrador del bot.`
        );
        await ctx.deleteMessage(ctx.update.message.message_id);
      } catch (e) {
        console.error(e);
      }
    }
  }
});

bot.launch({ allowedUpdates: true }, () => {
  blacklist = fs
    .readFileSync(`${process.cwd()}/blacklist.txt`, { encoding: "utf-8" })
    .toLowerCase()
    .split("\r\n");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
