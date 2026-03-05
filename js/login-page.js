const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Login successful:", data.message);
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("userData", JSON.stringify(data.user));
            window.location.href = "/index.html";
        } else {
            console.error("login failed", data.message);
            const errorMsg = document.getElementById("error-msg");
            if (errorMsg) {
                errorMsg.textContent = data.message;
                errorMsg.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error during login:", error);
    }

});