import chalk from "chalk";
import moment from "moment";

export class Logger {
  constructor(options) {
    this.dateFormat = options?.dateFormat ?? "YYYY-MM-DD";
    this.timestamp = moment().format(`${this.dateFormat}, HH:mm:ss`);
    this.newline = /^win/.test(process.platform) ? "\r\n" : "\n";
    this.logType = (type) => {
      const types = {
        log: () => chalk.bgCyan.black("LOG"),
        error: () => chalk.bgRed.black("ERROR"),
      };

      return (types[type] || types["default"])();
    };
  }

  #formatText(entry, type = "default") {
    return `[${this.timestamp}] ${this.logType(type)} - ${entry}${
      this.newline
    }`;
  }

  log(entry) {
    process.stdout.write(this.#formatText(entry, "log"));
  }

  error(entry) {
    process.stderr.write(this.#formatText(entry, "error"));
  }
}
