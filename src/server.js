const app = require("./app");

const PORT = process.env.PORT || 3000;

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World! 4 🌎🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running new on http://localhost:${PORT}`);
});


// require("./jobs/notification_jobs/daily_jobs");
// require("./jobs/consumer/favoriteEventProcessor");

