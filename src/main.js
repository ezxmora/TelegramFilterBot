import { Telegraf } from "telegraf";
import fs from "fs";
import "dotenv/config";

const bot = new Telegraf(process.env.BOT_TOKEN);
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
  const messageContent = ctx.update.message?.text;
  if (!messageContent.length) return;

  const findUrl = splittedMessage.find((v) => v.includes("https://"));
  if (findUrl) {
    const validUrl = validateUrl(findUrl.toString());
    if (validUrl) {
      const { id, username, first_name } = ctx.message.from;
      process.stdout.write(
        `DELETED ${id} - ${username} / ${first_name} - ${findUrl}\n`
      );
      await ctx.reply(
        `¡Vaya ${first_name}! 😱\nParece que has pasado un tweet de un subnormal registrado.\nSi crees que ha sido un falso positivo contacta con el administrador del bot.`
      );
      await ctx.deleteMessage(ctx.message.message_id);
    }
  }
});

bot.launch(() => {
  blacklist = fs
    .readFileSync(`${process.cwd()}/blacklist.txt`, { encoding: "utf-8" })
    .toLowerCase()
    .split("\r\n");
});
