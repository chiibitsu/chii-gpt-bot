import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const conversationHistory = new Map();

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  if (message.channel.name !== "chii-gpt") return;

  const userId = message.author.id;
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, [
      { role: "system", content: "You are a helpful assistant who responds succinctly" },
    ]);
  }

  const userMessages = conversationHistory.get(userId);
  userMessages.push({ role: "user", content: message.content });

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: userMessages,
    });

    const content = response.data.choices[0].message;
    const contentText = content.text;

    userMessages.push({ role: "assistant", content: contentText });

    if (contentText.trim() === '') {
      return message.reply("I don't have anything to say about that.");
    } else {
      return message.reply(contentText);
    }

  } catch (err) {
    console.error('Error:', err);
    return message.reply(
      "Oops, looks like I errored out. Contact my human overload, Chii#0615, or just try again later."
    );
  }
});

client.login(process.env.BOT_TOKEN);
