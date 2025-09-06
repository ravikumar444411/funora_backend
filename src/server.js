const app = require("./app");

const PORT = process.env.PORT || 3000;

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World! 9 🌎🚀");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});



// require("./jobs/notification_jobs/daily_jobs");
// require("./jobs/consumer/favoriteEventProcessor");

