import express from "express";
import morgan from "morgan";

const app = express();
const PORT = 8000;
const adminUsername = "admin";
const adminPassword = "admin";
const userUsername = "user";
const userPassword = "user";
let tickets = [];

app.use(express.json());

// HTTP request logging
app.use(morgan("dev"));

app.use(express.static("./", { index: false }));

app.get("/", (req, res) => {
    res.sendFile("pages/login-page.html", { root: "./" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on your IP address or localhost:${PORT}`);
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === adminUsername && password === adminPassword) {
        res.json({ success: true, message: "Logged in as admin", user: { name: "Admin", email: "admin@helpdesk.com" } });
    } else if (username === userUsername && password === userPassword) {
        res.json({ success: true, message: "Logged in as user", user: { name: "User", email: "user@helpdesk.com" } });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

app.post("/createTicket", (req, res) => {
    console.log("Server-Side ticket data:", req.body);

    const { ticketTitle, ticketDescription, ticketPriority } = req.body;

    if (ticketTitle && ticketDescription && ticketPriority) {

        const newTicket = {
            id: Date.now(),
            title: ticketTitle,
            description: ticketDescription,
            priority: ticketPriority,
            status: "pending"
        };

        tickets.push(newTicket);
        console.log("ticket saved. Total tickets:", tickets.length);

        res.json({ success: true, message: "Ticket created successfully", ticket: newTicket });

    } else {

        res.status(400).json({ success: false, message: "Missing required fields" });

    }
});

app.get("/getTickets", (req, res) => {
    res.json(tickets);
});

app.delete("/deleteTicket/:id", (req, res) => {
    const ticketID = parseInt(req.params.id);

    const initialLength = tickets.length;
    tickets = tickets.filter(t => t.id !== ticketID);

    if (tickets.length < initialLength) {
        res.json({ success: true, message: "Ticket deleted successfully" });
    } else {
        res.status(404).json({ success: false, message: "Ticket not found" });
    }
});
