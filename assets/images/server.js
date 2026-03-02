import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public")); // serve your frontend files

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});