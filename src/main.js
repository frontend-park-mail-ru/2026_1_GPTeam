import { Router } from './router/Router.js';
import { IndexPage } from './pages/Index/index.js';
// import { LoginPage } from './pages/LoginPage/LoginPage.js';
// import { RegisterPage } from './pages/RegisterPage/RegisterPage.js';
// import { HomePage } from './pages/HomePage/HomePage.js';
// import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage.js';
// import { checkSession } from './api/auth.js';
// import { appStore } from './store/Store.js';

const root = document.getElementById('app');
export const router = new Router(root);

router
    .addRoute('/', () => new IndexPage())
    // .addRoute('/login', () => new LoginPage())
    // .addRoute('/register', () => new RegisterPage())
    // .addRoute('/404', () => new NotFoundPage());

// При старте — проверяем сессию (требование №5)
async function init() {
    // const user = await checkSession();
    // if (user) {
    //     appStore.set('user', user);
    //     appStore.set('isAuth', true);
    // }
    router.start();
}

init();
