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
  const messageContent = ctx.update.message.text;
  const splittedMessage = messageContent.split(" ");
  const findUrl = splittedMessage.find((v) => v.includes("https://"));
  if (findUrl) {
    const validUrl = validateUrl(findUrl.toString());
    if (validUrl) {
      await ctx.reply(
        `¡Vaya ${ctx.message.from.first_name}! 😱\nParece que has pasado un tweet de un subnormal registrado.\nSi crees que ha sido un falso positivo contacta con el administrador del bot`
      );
      await ctx.deleteMessage(ctx.message.message_id);
    }
  }
});

bot.launch(() => {
  blacklist = fs
    .readFileSync("./blacklist.txt", { encoding: "utf-8" })
    .toLowerCase()
    .split("\r\n");
});
