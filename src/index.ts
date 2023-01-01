import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { gptResponse } from './gpt';

// Whatsapp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true },
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

  // Whatsapp message_create
  client.on('message_create', async (message: any) => {
    console.log(message.body);
    if (message.body.length == 0) return;
    if (message.from == 'status@broadcast') return;
    gptResponse(client, message);
  });

  client.initialize();
};

start();
