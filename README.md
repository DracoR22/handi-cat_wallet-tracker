<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/DracoR22/handi-cat_wallet-tracker">
    <img src="showcase/handi-cat.jpg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">🐱 Handi Cat | Wallet Tracker</h3>

  <p align="center">
    Track any Solana transaction in Real-Time
    <br />
    <br />
    <a href="https://t.me/handi_cat_bot"><strong>Use the Telegram bot -></strong></a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->

## About The Project

[![Product Name Screen Shot][product-screenshot]](https://t.me/handi_cat_bot)

Handi Cat is a Telegram bot that can track any Solana wallet in real time, providing relevant information
of each transaction made in Pump.fun, Raydium and Jupiter including transaction hash, tokens and amount swapped, price of the token in SOL, token market cap and much more.

## Features

- 📈 Real-time tracking of any transaction
- 🔍 Detects Pump.fun, Raydium and Jupiter transactions
- 💰 Gets SOL price of the token swapped
- 📊 Get tokens market cap at the time swapped
- 💰 Gets token amount and supply percentage owned by each tracked wallet
- 🤖 Each transaction message includes links to popular Solana trading bots to quickly buy the token
- 🔗 Each transaction provides links to Photon, GMGN and Dex Screener to quickly see the token chart

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Built With

- 🌐 Node.JS
- 📘 TypeScript
- 📊 Prisma and Prisma Pulse
- 🪙 Solana Web3.js

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

Follow these simple steps to setup Handi Cat locally on your machine

### Prerequisites

**Node version 14.x**

### Steps

1. Clone the repo

   ```sh
   git clone https://github.com/DracoR22/handi-cat_wallet-tracker.git
   ```

2. Install NPM packages

   ```sh
   pnpm install
   ```

3. Rename `.env.example` file to `.env`

4. Go to `supabase.com` and create a free database

5. In your `Supabase` dashboard go to `Project Settings` -> `Database` paste the connection string into `SUPABASE_DATABASE_URL` environment variable. Make sure you activate the `pooler connection` and set the
   port to `5432` your connection string should look like this: `postgresql://postgres.[PROJECT_URL]:[YOUR-PASSWORD]@aws-0-[YOUR-DB-REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
`

6. Now you need to [Setup Prisma Pulse with a Supabase database](https://medium.com/@dilsharahasanka/prisma-pulse-hands-on-guide-b220954b3245) for real time database logs

7. After you get your `Prisma Pulse` API key, paste it in the `PULSE_API_KEY` environment variable

8. Create a new `Telegram Bot` using `Bot Father` and get your `BOT_TOKEN`, then paste it in the environment variable

9. Run migrate command to push the database schemas and generate all types

```sh
  pnpm db:migrate
```

10. Now you have to setup an rpc provider in `src/providers/solana.ts`, you can change all NETWORKS to `SOLANA_NETWORK` if you dont have one

11. Start the bot

```sh
  pnpm start
```

11. That's it! now your local version of Handi Cat is ready, you can also fill the other environment variables to setup an RPC of your choice

<p align="center"><img src="./showcase/cli-pic.png" width="95%" alt="Screenshot of bot succesfully running"/></>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

<!-- [@your_twitter](https://twitter.com/your_username)  --> - rdraco039@gmail.com

My solana wallet for the struggles - `5EVQsbVErvJruJvi3v8i3sDSy58GUnGfewwRb8pJk8N1`

Project Link: [https://github.com/DracoR22/handi-cat_wallet-tracker](https://github.com/DracoR22/handi-cat_wallet-tracker)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/othneildrew/Best-README-Template/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=for-the-badge
[forks-url]: https://github.com/othneildrew/Best-README-Template/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=for-the-badge
[issues-url]: https://github.com/othneildrew/Best-README-Template/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/othneildrew
[telegram-bot]: https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white
[product-screenshot]: showcase/notifications-new.png
