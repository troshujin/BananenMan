import dotenv from "dotenv";
dotenv.config();

export default {
  prefix: "?",
  owners: [
    "196606443703631874", // troshujin
    "265535215059861514", // piet323
  ],
  token: process.env.BOT_TOKEN,
  dataFolder: "./data",
  defaultSettings: {
    motd: "Purkachu is super cool!",
  }
};

console.log(`[Config] ${process.env.BOT_TOKEN ? "Loaded BOT_TOKEN successfully" : "Was unable to load BOT_TOKEN"}`)
console.log(`[Config] ${process.env.CLIENT_ID ? "Loaded CLIENT_ID successfully" : "Was unable to load CLIENT_ID"}`)
console.log(`[Config] ${process.env.GITHUB_TOKEN ? "Loaded GITHUB_TOKEN successfully" : "Was unable to load GITHUB_TOKEN"}`)
console.log(`[Config] ${process.env.GITHUB_USERNAME ? "Loaded GITHUB_USERNAME successfully" : "Was unable to load GITHUB_USERNAME"}`)
