# DiagnoCrypt – AI Health Chatbot

## Run on your computer
1. Install Node.js 18 or newer from https://nodejs.org
2. Get a FREE Gemini API key at https://aistudio.google.com/apikey (sign in with a Google account, no card needed).
   (Optional paid alternative: set PROVIDER=claude and use a key from https://console.anthropic.com)
3. In this folder, open a terminal and run:

       npm install
       copy .env.example .env        (Windows)   |   cp .env.example .env   (Mac/Linux)

4. Open `.env` in a text editor and replace `paste-your-gemini-key-here` with your key.
5. Start the app:

       npm start

6. Open http://localhost:3000 in your browser.

## Structure
- `server.js`      Express backend. Keeps your API key private and calls Claude.
- `public/index.html`  The whole front end (login, home, chat, features).

## Notes
- Accounts and health data are stored encrypted in the browser (localStorage) on each device. Clearing browser data deletes them.
- Free-tier Gemini content may be used by Google to improve its products, so don't type real private medical details while demoing, or switch to a paid key.
- If you see 'Too many requests', you hit the free limit; wait a minute. If the model name is retired, change MODEL in .env.
- Never put your API key in `public/index.html` or commit `.env`.
- General health information only, not medical diagnosis.
