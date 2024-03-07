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

export const findUrl = (message) => {
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

export const validateUrl = (url) => {
  const twitterRegex = new RegExp(
    /(https|http):\/\/(www\.)?(x|twitter|fixupx|fxtwitter)\.com\/(\w+)\/(status(?:es)?)\/(\d+)/gim
  );

  return twitterRegex.exec(url);
};
