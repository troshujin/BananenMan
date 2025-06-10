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
