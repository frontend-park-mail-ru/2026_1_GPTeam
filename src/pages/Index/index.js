// src/pages/LoginPage/LoginPage.js

/**
 * @module LoginPage
 * @description Страница авторизации
 */

import { BasePage } from '../base_page.js';
import { Header } from '../../components/Header/Header.js';

export class IndexPage extends BasePage {
    /**
     * @param {HTMLElement} root
     */
    async render(root) {
        // Каркас страницы
        root.innerHTML = `
      <div class="page page--login">
        <header class="page__header"></header>
        <main class="page__content"></main>
      </div>
    `;

        // Header
        const header = new Header({});
        header.render(root.querySelector('.page__header'));
        this._components.push(header);

        // LoginForm
        // const form = new LoginForm({
        //     onSubmit: async (credentials) => {
        //         const user = await login(credentials);
        //         appStore.set('user', user);
        //         appStore.set('isAuth', true);
        //         router.navigate('/');
        //     },
        // });
        // form.render(root.querySelector('.page__content'));
        // this._components.push(form);
    }
}
