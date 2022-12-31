import process from 'process';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { ChatGPTAPIBrowser } from 'chatgpt';

// Environment variables
require('dotenv').config();

// Prefix check
const prefixEnabled = process.env.PREFIX_ENABLED == 'true';
const prefix = '!gpt';

// Whatsapp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
});

async function initChatGPT() {
  const api = new ChatGPTAPIBrowser({
    email: String(process.env.EMAIL),
    password: String(process.env.PASSWORD),
    isGoogleLogin: true,
  });

  await api.initSession();

  return {
    sendMessage: (message, opts = {}) => {
      return api.sendMessage(message, opts);
    },
  };
}

// ChatGPT Client

const api = await initChatGPT().catch(e => {
  console.error(e);
  process.exit();
});

// Entrypoint
const start = async () => {
  // Whatsapp auth
  client.on('qr', (qr: string) => {
    console.log('[Whatsapp ChatGPT] Scan this QR code in whatsapp to log in:');
    qrcode.generate(qr, { small: true });
  });

  // Whatsapp ready
  client.on('ready', () => {
    console.log('[Whatsapp ChatGPT] Client is ready!');
  });

  // Whatsapp message
  client.on('message_create', async (message: any) => {
    console.log(message.body);
    if (message.body.length == 0) return;
    if (message.from == 'status@broadcast') return;

    if (prefixEnabled) {
      if (message.body.startsWith(prefix)) {
        // Get the rest of the message
        const prompt = message.body.substring(prefix.length + 1);
        await handleMessage(message, prompt);
      }
    } else {
      await handleMessage(message, message.body);
    }
  });

  client.initialize();
};

const handleMessage = async (message: any, prompt: any) => {
  try {
    const start = Date.now();

    // Send the prompt to the API
    console.log(
      '[Whatsapp ChatGPT] Received prompt from ' + message.from + ': ' + prompt,
    );
    const response = await api.sendMessage(prompt);

    console.log(
      `[Whatsapp ChatGPT] Answer to ${message.from}: ${response.response}`,
    );

    const end = Date.now() - start;

    console.log('[Whatsapp ChatGPT] ChatGPT took ' + end + 'ms');

    // Send the response to the chat
    message.reply(response.response);
  } catch (error: any) {
    message.reply(
      'An error occured, please contact the administrator. (' +
        error.message +
        ')',
    );
  }
};

start();
