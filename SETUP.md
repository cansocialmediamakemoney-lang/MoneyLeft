# MoneyLeft Setup Guide

This guide will take you from zero to a running MoneyLeft app on your computer. **No prior experience required.** I'll explain every step.

When you're done, you'll have:
- The MoneyLeft app running on your computer at `localhost:3000`
- A real database storing user accounts and budget data
- The scam checker working

We'll save Vercel deployment for the next message — get this running locally first.

---

## What you need to install (one time, ~15 minutes)

### 1. Install Node.js

This is the engine that runs the app on your computer.

- Go to https://nodejs.org
- Download the **LTS** version (the green button on the left)
- Run the installer. Click "Next" through everything — defaults are fine.
- After it finishes, restart your computer (this is important so Node is recognized everywhere).

**Verify it worked:** Open Terminal (Mac) or Command Prompt (Windows) and type:
```
node --version
```
You should see something like `v20.11.0`. If you see "command not found," restart your computer and try again.

### 2. Install Visual Studio Code (your code editor)

- Go to https://code.visualstudio.com
- Download for your operating system
- Install with default settings

### 3. Create a Supabase account (free)

Supabase will host your database and handle user accounts.

- Go to https://supabase.com
- Click "Start your project" → sign in with GitHub or email
- Click **"New project"**
- Fill in:
  - **Name:** moneyleft (anything you want)
  - **Database password:** Click "Generate" and **save it somewhere safe** (you may need it later)
  - **Region:** Pick the one closest to you
  - **Plan:** Free
- Click "Create new project" and wait ~2 minutes for it to set up

### 4. Create an Anthropic account (for the scam checker)

- Go to https://console.anthropic.com
- Sign up
- Add a small amount of credit ($5 is plenty for testing — costs are pennies per scan)
- Go to **Settings → API Keys → Create Key**
- Copy the key that starts with `sk-ant-...` and save it. You'll only see it once.

---

## Set up your project (~5 minutes)

### 1. Unzip the project files

You should have downloaded `moneyleft.zip`. Unzip it to a place you'll remember, like your Desktop. You'll see a folder called `moneyleft`.

### 2. Open the project in VS Code

- Open VS Code
- Click **File → Open Folder**
- Pick the `moneyleft` folder you just unzipped
- If VS Code asks "Do you trust the authors of the files?" click **Yes, I trust the authors**

### 3. Open the built-in terminal

In VS Code:
- Click **Terminal → New Terminal** (or press Ctrl+\` / Cmd+\`)
- A black box appears at the bottom — that's the terminal

### 4. Install the project's dependencies

In the terminal, type:
```
npm install
```
Press Enter. This will download all the libraries the app needs. It takes 1–3 minutes.

You'll see a lot of text — that's normal. When it finishes you'll get your prompt back.

---

## Connect your database (~10 minutes)

### 1. Create the database tables

- Go to your Supabase project dashboard
- In the left sidebar, click **SQL Editor**
- Click **+ New query**
- Open the file `supabase-schema.sql` in VS Code
- Copy ALL of its contents and paste them into the Supabase SQL editor
- Click the green **Run** button at the bottom right

You should see "Success. No rows returned." That means the tables were created.

### 2. Configure email confirmation (optional but recommended)

By default Supabase requires users to verify their email before signing in. For local testing, you can turn this off:

- In Supabase, go to **Authentication → Providers → Email**
- Toggle **"Confirm email"** to **OFF** (just for local testing)
- Click **Save**

(In production you should turn this back on.)

### 3. Get your Supabase keys

- In Supabase, click **Settings** (gear icon at the bottom of the left sidebar)
- Click **API**
- You'll see two important things:
  - **Project URL** — looks like `https://xyzabc123.supabase.co`
  - **Project API keys → anon / public** — a long string starting with `eyJ...`
- Keep this tab open

### 4. Create your environment file

In VS Code:
- In the file list on the left, you'll see a file called `.env.example`
- Right-click it → **Copy**
- Right-click in empty space → **Paste**
- Rename the copy to `.env.local` (no extension after .local)

Open `.env.local` and replace the placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
ANTHROPIC_API_KEY=sk-ant-...
```

Use your real Supabase URL, your real anon key, and your real Anthropic key.

**⚠️ NEVER share or commit `.env.local` — it contains secrets.** The `.gitignore` file already protects it.

---

## Run the app! 🎉

In the VS Code terminal, type:
```
npm run dev
```

You should see something like:
```
▲ Next.js 14.2.15
- Local:        http://localhost:3000
✓ Ready in 2.1s
```

Open your web browser and go to **http://localhost:3000**

You should see the MoneyLeft welcome page!

---

## Test it out

1. Click "Create a Free Account" → enter an email + password
2. You'll be taken to the dashboard
3. Click ⚙️ Settings → enter your income, savings goal, and pay date → Save
4. Add a couple bills, log some spending
5. Try the scam checker — paste a sketchy-looking message
6. Sign out, sign back in — your data should still be there

---

## What to do if something breaks

| Problem | Fix |
|---|---|
| `npm install` errors | Make sure Node.js installed properly. Restart and try again. |
| "Invalid login credentials" | If you turned off email confirmation, sign up again with a new email. |
| Page won't load | Make sure `npm run dev` is still running in the terminal. |
| Scam checker says "not configured" | Your `ANTHROPIC_API_KEY` in `.env.local` is missing or wrong. |
| Anything 500 error | Check the VS Code terminal for the actual error message. |

To stop the app: in the terminal, press `Ctrl + C`.
To start it again: `npm run dev`.

---

## What's in this project (for your reference)

```
moneyleft/
├── app/                          # Every page of the app
│   ├── page.js                   # Landing page
│   ├── layout.js                 # Wraps every page
│   ├── login/page.js             # Sign in
│   ├── signup/page.js            # Sign up
│   ├── forgot-password/page.js
│   ├── reset-password/page.js
│   ├── dashboard/page.js         # Main "money left" view
│   ├── bills/page.js             # Manage bills
│   ├── spending/page.js          # Log a purchase
│   ├── history/page.js           # Past months
│   ├── settings/page.js          # Income/savings/pay date
│   ├── scam-check/page.js        # Scam checker UI
│   └── api/scam-check/route.js   # Server-side AI call
├── components/                   # Reusable UI pieces
│   ├── AppShell.js               # Header used on every page
│   └── UI.js                     # Buttons, inputs, cards
├── lib/                          # Helpers
│   ├── supabase-browser.js       # Database client (browser)
│   ├── supabase-server.js        # Database client (server)
│   ├── useBudgetData.js          # Hook to load user's data
│   └── constants.js              # Shared constants & helpers
├── middleware.js                 # Protects logged-in routes
├── supabase-schema.sql           # Database setup
├── .env.example                  # Template for your secrets
├── .env.local                    # YOUR secrets (you create this)
├── .gitignore                    # Keeps secrets out of git
├── package.json                  # Lists dependencies
├── tailwind.config.js            # Styling config
├── next.config.js                # Next.js config
└── postcss.config.js             # CSS processor config
```

---

## Next steps

Once you have this running:
1. Tell me, and I'll walk you through deploying to Vercel so it has a real `https://` URL
2. I can help you customize colors, add features, or fix bugs
3. I can help you set up a custom domain like `moneyleft.com`

If anything in this guide is confusing or doesn't work, just tell me what step you got stuck on and I'll help.
