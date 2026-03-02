import { Router } from "./router/router.js";
import { LoginPage } from "./pages/Login/login.js";
import { SignupPage } from "./pages/Signup/signup.js";
import "./styles/global.css";
import { LandingPage } from "./pages/Landing/landing.js";

const root = document.getElementById("app");
export const router = new Router(root);

router
    .addRoute("/", () => new LandingPage())
    .addRoute("/login", () => new LoginPage())
    .addRoute("/signup", () => new SignupPage());

async function init() {
    router.start();
}

init();