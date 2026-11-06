# Project 7: NASA API - Space Explorer App
NASA releases a new "Astronomy Picture of the Day" (APOD) every day—spotlighting breathtaking images of galaxies, stars, planets, and more.

Your task is to build an interactive web app that fetches and displays these photos using [NASA's API](https://api.nasa.gov/). Users will pick a date range and instantly view stunning photos from across the cosmos, along with titles and descriptions.

You'll get to use your skills to build something that's actually connected to real-world data from one of the most iconic organizations in the world.

## Starter Files
- The provided files include a NASA logo, date inputs, a button, a placeholder for your gallery, and basic layout and styling to help you get started.
- It also includes built-in logic (in `dateRange.js`) to handle the valid APOD date range—from June 16, 1995 to today. No need to modify it.
- All your custom JavaScript should go in `script.js`. That's where you'll write the code that fetches data and displays your gallery.

## Run the APOD API connection

The project includes a small Node.js server in `server.js`. It keeps your NASA API key on the server and provides the browser with a same-origin `/api/apod` route.

1. Use `.env.example` as a reference and export the environment variables in your terminal (the server does not read `.env` files automatically):

   ```bash
   export NASA_API_KEY="your_personal_nasa_api_key"
   export PORT=3000
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open `http://localhost:3000` in your browser.

The Node server serves both the website and `/api/apod` on port 3000. Do not put
the API key in `js/script.js` or commit it to Git. The API key is added to the
NASA request only by `server.js`.
