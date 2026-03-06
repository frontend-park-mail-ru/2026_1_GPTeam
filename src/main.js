import { router } from "./router/router_instance.js";
import { LoginPage } from "./pages/Login/login.js";
import { SignupPage } from "./pages/Signup/signup.js";
import { BudgetPage } from "./pages/Budget/budget.js";
import "./styles/global.css";
import { LandingPage } from "./pages/Landing/landing.js";

router
    .addRoute("/", () => new LandingPage())
    .addRoute("/login", () => new LoginPage())
    .addRoute("/signup", () => new SignupPage())
    .addRoute("/budget", () => new BudgetPage());

async function init() {
    router.start();
}

init();