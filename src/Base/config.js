import dotenv from "dotenv";
dotenv.config();

export default {
  prefix: "?",
  owners: ["196606443703631874"],
  token: process.env.BOT_TOKEN,
  soullinkDataDir: "./soullinkRunData"
};
