# Valorant Tracker Mobile App (PWA & APK)

A beautiful, premium mobile-first web app and native Android app for tracking Valorant player statistics, match history, real-time live match details (with ranks, RR, and skins), and checking player daily storefront gun skins.

## Features

- 🔐 **Real Riot Games Authentication**: Log in securely using your Riot account credentials to fetch your real store storefront.
- 🏪 **Daily Storefront**: View your actual daily weapon skin offers with VP prices, rarity tiers, and live countdown timers.
- 🏠 **Personal Dashboard**: View player level, rank badge, MMR rating progress bar, win rate, K/D ratio, and headshot percentages.
- 🔴 **Live Match Viewer**: Track real-time live match details, team scores, ranks, and weapon skins of everyone in the lobby.
- 📊 **Career Matches**: Detailed match history with filter chips for Competitive, Unrated, Swiftplay, and other game modes.
- ⚡ **Agent Pre-selector**: View all agents, their roles, and abilities, and choose a favorite agent with an animated glowing highlight.

## Installation & Deployment

### 🌐 Deploying to Vercel (Free Web Hosting)
1. Import this repository into a new project on [Vercel](https://vercel.com).
2. Vercel will automatically detect the Vite config and deploy the frontend along with the serverless API backend proxies under `api/`.
3. Open the live URL on your phone or PC browser and log in with your Riot account!

### 📱 Generating the Android APK (Free Cloud Compile)
Whenever you push to the `main` or `master` branch, GitHub Actions will compile the Android APK for you:
1. Go to the **Actions** tab of this repository.
2. Select the latest successful run of the **Build Android APK** workflow.
3. Scroll down to the **Artifacts** section and download **valorant-tracker-apk**.
4. Unzip and install `app-debug.apk` directly on your Android device!
