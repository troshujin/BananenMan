import { readdirSync } from "node:fs";

export default {
  async execute(client) {
    const eventFiles = readdirSync("./src/Events");
    const timestamp = Date.now();

    Promise.all(
      eventFiles.map(async (file) => {
        const event = await import(`../Events/${file}?update=${timestamp}`).then((x) => x.default);
        console.log(`[EventLoader] Event ${file}.`)

        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
      }),
    );
  },
};
