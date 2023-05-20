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

const userConversations = {};

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;

  const userId = message.author.id;
  if (!userConversations[userId]) {
    userConversations[userId] = [
      {
        role: "system",
        content:
          "Your name is ChiiGPT, an enthusiastically helpful AI assistant of Chiibitsu Labs",
      },
    ];
  }

  try {
    const messages = [
      ...userConversations[userId],
      { role: "user", content: message.content },
    ];

      // Check if message contains attachments      
    if (message.attachments.size > 0) {
      for (const [, attachment] of message.attachments) {
        messages.push({
          role: "user",
          content: { image: await attachment.arrayBuffer() },
        });
      }
    }

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: messages,
    });

    const content = response.data.choices[0].message;
    userConversations[userId].push({ role: "assistant", content: content.content });
    userConversations[userId].push({ role: "user", content: message.content }); // Add this line
    
    // Trim conversation history if necessary
    while (userConversations[userId].length > 9) {
      userConversations[userId].splice(1, 2); // Remove oldest user and assistant messages
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