import Handlebars from "handlebars";


Handlebars.registerHelper("equal", function (a, b, options) {
    return (a === b) ? options.fn(this) : options.inverse(this);
})
