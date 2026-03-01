import { Router } from "./router/router.js";
import { IndexPage } from "./pages/Index/index.js";
import { LoginPage } from "./pages/Login/login.js";

const root = document.getElementById("app");
export const router = new Router(root);

router
    .addRoute("/", () => new IndexPage())
    .addRoute("/login", () => new LoginPage())
    .addRoute("/404", () => new IndexPage());

async function init() {
    router.start();
}

init();
