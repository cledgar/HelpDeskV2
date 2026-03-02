import express from "express";
import morgan from "morgan";

const app = express();
const PORT = 8080;

app.use(express.json());

// HTTP request logging
app.use(morgan("dev"));

app.use(express.static("./"));

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "./" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on your IP address or localhost:${PORT}`);
});