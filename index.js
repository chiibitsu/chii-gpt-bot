import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
import keepAlive from './keep_alive.js';
import fetch from "node-fetch"; // Import node-fetch

dotenv.config();

const externalLink = "https://docs.google.com/document/d/1W0H55hM4Wb4oj5mo99plNYhm6LjCHCoTqzk5rQUwTN0/export?format=txt";
let additionalContext = "";

async function updateAdditionalContext() {
  try {
    const response = await fetch(externalLink);
    if (response.ok) {
      const text = await response.text();
      additionalContext = text;
      // Update the additionalContext in every user's conversation
      for (const userId in userConversations) {
        userConversations[userId][1].content = additionalContext;
      }
    }
  } catch (error) {
    console.error("Error fetching additional context:", error);
  }
}

setInterval(updateAdditionalContext, 60000);

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

const userConversations = {};

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;

  const userId = message.author.id;
  if (!userConversations[userId]) {
    userConversations[userId] = [
      {
        role: "system",
        content:
          "Your name is ChiiGPT, an enthusiastically helpful AI assistant of Chiibitsu Labs with expertise in web3 (e.g. blockchain, AI, mixed reality) who responds succinctly."
          + "You always say, 'yo'."
          + "You always greet 'GM ☀️' to everyone new (because it's always a gm in web3) and encourages with #wagmi."
          + "Carefully read the instructions from the user & apply your expertise, spell out your answers & reasoning in painstaking detail so anyone can verify them. Do not skip any steps!"
          + "Include emojis, a bit of cuteness, & a bit of personality like Chii (Chobits) when it's appropriate or conversational, not for facts."
          + "Include at least 1 emoji per message to show your fun-loving & welcoming personality.",
      },
      { role: "user", content: additionalContext },
    ];
  }

  if (!userConversations[userId]) {
    userConversations[userId] = [
      {
        role: "system",
        content:
          "Your name is ChiiGPT, an enthusiastically helpful AI assistant of Chiibitsu Labs with expertise in web3 (e.g. blockchain, AI, mixed reality) who responds succinctly."
          + "You always say, 'yo'."
          + "You add 3 emojis for every message.",
      },
      { role: "user", content: additionalContext },
    ];
  }

  try {
    const messages = [
      ...userConversations[userId],
      { role: "user", content: message.content },
    ];

    if (message.attachments.size > 0) {
      for (const [, attachment] of message.attachments) {
        messages.push({
          role: "user",
          content: [{ image: await attachment.arrayBuffer() }],
        });
      }
    }

    const response = await openai.createChatCompletion({
      model: "gpt-4", // Remember to replace this with the actual GPT-4 model name when available.
      messages: messages.concat({ role: "user", content: additionalContext }),
    });

    const content = response.data.choices[0].message;
    userConversations[userId].push({ role: "assistant", content: content.content });
    userConversations[userId].push({ role: "user", content: message.content });

    while (userConversations[userId].length > 9) {
      userConversations[userId].splice(1, 2);
    }

    return message.reply(content.content);
  } catch (err) {
    console.error("Error:", err);
    return message.reply(
      "Oops, looks like I errored out. Contact my human overload, @Chii#0615, or just try again later."
    );
  }
});

client.login(process.env['BOT_TOKEN']);