require("./config/loadEnv");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World! 9 🌎🚀");
});


app.get("/deeplink/event/:id", (req, res) => {
  const eventId = req.params.id;
  const packageName = "com.funora.app"; // replace with your package name

  // Construct deep link (custom scheme or app link)
  const deepLink = `funora://deeplink/event/${eventId}`;

  // Try opening the app
  const html = `
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url=${deepLink}">
      </head>
      <body>
        <script>
          setTimeout(() => {
            window.location.href = "https://play.google.com/store/apps/details?id=${packageName}";
          }, 1500);
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running new on http://localhost:${PORT}`);
});


// require("./jobs/notification_jobs/daily_jobs");
// require("./jobs/consumer/favoriteEventProcessor");

