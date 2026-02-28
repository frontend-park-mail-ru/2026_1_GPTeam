import { BaseComponent } from '../base_component.js';
import template from './Header.hbs?raw';
import './Header.css';

export class Header extends BaseComponent {
    /**
     * @param {InputProps} props
     */
    constructor(props) {
        const fullProps = {
            // type: 'text',
            // placeholder: '',
            // value: '',
            // error: '',
            // required: false,
            // autocomplete: 'off',
            ...props,
            isAuth: false,
            // id: props.id || props.name,
        };

        super(template, fullProps);

        // /** @type {Function|undefined} */
        // this._onInput = props.onInput;
        //
        // /** @type {Function|undefined} */
        // this._onBlur = props.onBlur;
    }
}
