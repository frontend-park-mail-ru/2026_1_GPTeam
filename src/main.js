import { Router } from "./router/router.js";
import { IndexPage } from "./pages/Index/index.js";
import { LoginPage } from "./pages/Login/login.js";
import { SignupPage } from "./pages/Signup/signup.js";
import "./styles/global.css";

const root = document.getElementById("app");
export const router = new Router(root);

router
    .addRoute("/", () => new IndexPage())
    .addRoute("/login", () => new LoginPage())
    .addRoute("/signup", () => new SignupPage());

async function init() {
    router.start();
}

init();