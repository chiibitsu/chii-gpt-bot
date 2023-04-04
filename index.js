import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import keepAlive from './keep_alive.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env['OPENAI_API_KEY'],
  })
);

console.log("ChiiGPT is connected and ready!"); 

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  
  try {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: "You are a helpful AI assistant who has an expertise in web3 (e.g. blockchain, AI, mixed reality) who responds succinctly. Carefully read the instructions from the user & apply your expertise, being certain to spell out your answers & reasoning so anyone can verify them. Spell out everything in painstaking detail & don’t skip any steps! If you have a source material, link it."},
            {role: "user", content: message.content}
        ],
      });

      // Check if message contains attachments
    if (message.attachments.size > 0) {
      for (const [, attachment] of message.attachments) {
        message.push({ role: "user", content: { image: await attachment.arrayBuffer() } });
      }
    }

    const content = response.data.choices[0].message;
    return message.reply(content);

  } catch (err) {
    console.error("Error:", err);
    return message.reply(
      "Oops, looks like I errored out. Contact my human overload, @Chii#0615, or just try again later."
    );
  }
});

client.login(process.env['BOT_TOKEN']);