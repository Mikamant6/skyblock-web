# FlawlessSB

Tools for Hypixel SkyBlock: enter a Minecraft name and a profile name and get networth, shard values and progress guides automatically from the Hypixel API. Not affiliated with or endorsed by Hypixel or Mojang.

Live: https://flawlesssb.de

## Run locally

1. Put your own Hypixel API key into `.env.local` as `HYPIXEL_API_KEY=...` (this file is not committed and must never be shared).
2. `npm install`
3. `npm run dev` and open http://localhost:3000

## Structure

- `app/` pages, layout and design (themes: Winter and Classic, see `app/globals.css`)
- `lib/` data fetching and pure logic (with tests next to the code)
- `data/` generated data files (guides, recipes, icons)
- `scripts/` one-time scripts that fetch data from the wiki and API
- `public/` images

## Notes

- Shard data is partly based on the Hypixel SkyBlock Wiki (CC BY-NC-SA 3.0). Networth is calculated with the SkyHelper-Networth library (MIT).
- Logo and artwork are our own designs, no Hypixel or Minecraft marks.
