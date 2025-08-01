# Example Discord Bot Handler - V14

- **Project built on `discord.js` v14.**
- **Minimum required Node.js version: v16.11.**
- **Example command setup can be found in [`src/Commands/info/ping.js`](https://github.com/memte/ExampleBot/blob/v14/src/Commands/info/ping.js).**  
  For more details, visit the [Discord.js Guide](https://discordjs.guide/slash-commands/advanced-creation.html).

- **Note: Remember to configure your settings in the [`config.js`](https://github.com/memte/ExampleBot/blob/v14/src/Base/config.js) file and Don't forget to prepare a .env file in the same way as in [`example.env`](https://github.com/memte/ExampleBot/blob/v14/example.env)**!

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=memte/ExampleBot&type=Date)](https://www.star-history.com/#memte/ExampleBot&Date)

## 🌟 Support the Project

If you find this project helpful, consider giving it a ⭐ on GitHub!

![Vote](https://user-images.githubusercontent.com/63320170/175336722-373eaf92-1454-4bce-b97c-e8a629c2628e.png)

### [Click here for the Discord.js V13 version.](https://github.com/memte/ExampleBot/tree/v13)


## Commands 
Start bot:

```cmd
pm2 start npm --name "discord-bot" -- run bot
```

View logs:

```cmd
pm2 logs
```

Restart:

```cmd
pm2 restart discord-bot
```

Stop:

```cmd
pm2 stop discord-bot
```

### Less manual

```cmd
docker compose up [-d] [--build]

docker compose down
```

or 

```cmd
docker build -t discord-bot .

docker run --name discord-bot --env-file .env discord-bot [-d]

docker stop discord-bot
```
