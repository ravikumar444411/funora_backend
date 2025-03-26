const app = require("./app");

const PORT = process.env.PORT || 3000;

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World! 2 🌎🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running new on http://localhost:${PORT}`);
});
