import { router } from "./router/router_instance.js";
import { LoginPage } from "./pages/Login/login.js";
import { SignupPage } from "./pages/Signup/signup.js";
import { BudgetPage } from "./pages/Budget/budget.js";
import "./styles/global.css";
import { LandingPage } from "./pages/Landing/landing.js";
import {ProfilePage} from "./pages/Profile/profile.js";
import {BalancePage} from "./pages/Balance/balance.js";

router
    .addRoute("/", () => new LandingPage())
    .addRoute("/login", () => new LoginPage())
    .addRoute("/signup", () => new SignupPage())
    .addRoute("/profile", () => new ProfilePage())
    .addRoute("/balance", () => new BalancePage());
    .addRoute("/budget", () => new BudgetPage());

async function init() {
    router.start();
}

init();