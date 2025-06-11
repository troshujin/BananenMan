import dotenv from "dotenv";
dotenv.config();

export default {
  prefix: "?",
  owners: ["196606443703631874"],
  token: process.env.BOT_TOKEN,
  dataFolder: "./data",
  defaultSettings: {
    motd: "BananenMan is king!",
    admin: [
      {
        id: "196606443703631874",
        username: "Trojo"
      }
    ]
  }
};

console.log(`[Config] ${process.env.BOT_TOKEN ? "Loaded BOT_TOKEN successfully" : "Was unable to load BOT_TOKEN"}`)
console.log(`[Config] ${process.env.CLIENT_ID ? "Loaded CLIENT_ID successfully" : "Was unable to load CLIENT_ID"}`)
console.log(`[Config] ${process.env.GITHUB_TOKEN ? "Loaded GITHUB_TOKEN successfully" : "Was unable to load GITHUB_TOKEN"}`)
console.log(`[Config] ${process.env.GITHUB_USERNAME ? "Loaded GITHUB_USERNAME successfully" : "Was unable to load GITHUB_USERNAME"}`)
