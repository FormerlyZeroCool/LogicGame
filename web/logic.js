import { SingleTouchListener, isTouchSupported, KeyboardHandler } from './io.js';
import { render_funky_regular_polygon, render_regular_polygon, getHeight, getWidth, RGB } from './gui.js';
import { random, srand, max_32_bit_signed } from './utils.js';
import { menu_font_size } from './game_utils.js';
class Peg {
    constructor(type_id) {
        this.type_id = type_id;
    }
    draw(canvas, ctx, x, y, width, height) {
        ctx.fillStyle = new RGB(125 + 60 * this.type_id % 256, 92 * this.type_id % 256, 125 * this.type_id % 256).htmlRBG();
        ctx.fillRect(x, y, width, height);
        ctx.lineWidth = 2;
        const radius = Math.min(height, width) / 2;
        if (this.type_id < 10) {
            render_regular_polygon(ctx, radius, this.type_id + 3, x + width / 2 - radius, y);
            const color_index = this.type_id + 4;
            ctx.fillStyle = new RGB(125 + 30 * color_index % 256, 62 * color_index % 256, 50 * color_index % 256).htmlRBG();
            ctx.fill();
        }
        else {
            render_funky_regular_polygon(ctx, radius, this.type_id + 3, x + width / 2 - radius, y);
        }
        ctx.beginPath();
    }
    draw_with_markup(canvas, ctx, answer, index, x, y, width, height) {
        this.draw(canvas, ctx, x, y, width, height);
        ctx.strokeStyle = new RGB(0, 0, 0, 125).htmlRBG();
        ctx.beginPath();
        ctx.lineWidth = 4;
        let isPresent = false;
        for (let i = 0; i < answer.length; i++) {
            if (answer[i].type_id === this.type_id)
                isPresent = true;
        }
        if (answer[index].type_id !== this.type_id) {
            if (isPresent) {
                ctx.moveTo(x, y + height / 2);
                ctx.lineTo(x + width, y + height / 2);
            }
            else {
                ctx.moveTo(x, y);
                ctx.lineTo(x + width, y + height);
                ctx.moveTo(x + width, y);
                ctx.lineTo(x, y + height);
            }
        }
        else {
            // if(answer[index].type_id === this.type_id)
            const radius = Math.min(height, width) - ctx.lineWidth;
            //ctx.moveTo(x + width / 2 + radius, y + height / 2);
            //ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
            ctx.font = radius + "px Helvetica";
            const check = "\u2713";
            const text_width = ctx.measureText(check).width;
            ctx.fillStyle = "#00FF00";
            ctx.strokeText(check, x + width / 2 - text_width / 2, y + radius * .95);
            ctx.fillText(check, x + width / 2 - text_width / 2, y + radius * .95);
        }
        ctx.stroke();
    }
    update_state(delta_time) {
    }
}
;
class LogicField {
    constructor(touchListener, answer_width, type_possibilities, guesses, height, width) {
        this.selected = null;
        this.touchListener = touchListener;
        this.height = height;
        this.width = width;
        this.answer = [];
        this.types = type_possibilities;
        this.number_of_guesses = guesses;
        srand(Math.random() * max_32_bit_signed - 1);
        for (let i = 0; i < answer_width; i++) {
            this.answer.push(new Peg(Math.floor(random() * type_possibilities)));
        }
        //this.answer = this.answer.fill(new Peg(0), 0, answer_width);
        /*this.answer = this.answer.map((element, index) => {
            element.type_id = Math.floor(random() * this.types);
            return element;
        });*/
        this.saved_guesses = [];
    }
    choices_per_guess() {
        return this.answer.length;
    }
    guesses() {
        return this.number_of_guesses;
    }
    is_in_peg_selector(touchPos) {
        return touchPos[0] > this.width * 0.9;
    }
    get_peg(y) {
        const index = Math.floor(y / this.height * this.types);
        return index < this.types ? new Peg(index) : null;
    }
    is_answered(answer) {
        if (!answer || answer.length === 0)
            return false;
        for (let i = 0; i < answer.length; i++) {
            if (answer[i].type_id === -1)
                return false;
        }
        return true;
    }
    try_to_place_peg(touchPos, selected) {
        const clickRowIndex = Math.floor(touchPos[1] / this.height * this.guesses());
        const rowHeight = this.height / this.guesses();
        const currentRowY = rowHeight * (this.guesses() - this.saved_guesses.length);
        if (touchPos[1] > currentRowY - rowHeight && touchPos[0] < this.width * 9 / 10) {
            const width = this.width * 9 / 10;
            const index = Math.floor(touchPos[0] / width * this.choices_per_guess());
            let answer = this.saved_guesses[this.saved_guesses.length - 1];
            if (!answer || this.is_answered(answer)) {
                this.saved_guesses.push([]);
                answer = this.saved_guesses[this.saved_guesses.length - 1];
            }
            for (let i = answer.length; i < this.choices_per_guess(); i++) {
                answer.push(new Peg(-1));
            }
            answer[index] = selected;
            return true;
        }
        return false;
    }
    has_won() {
        let won = true;
        if (this.saved_guesses.length)
            for (let i = 0; won && i < this.answer.length; i++) {
                won = (this.answer[i].type_id === this.saved_guesses[this.saved_guesses.length - 1][i].type_id);
            }
        else
            won = false;
        return won;
    }
    compare_answer(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    has_lost() {
        let lost = (!this.has_won() && this.saved_guesses.length === this.guesses());
        const final_guess = this.saved_guesses[this.saved_guesses.length - 1];
        if (lost) {
            lost = !this.compare_answer(final_guess, this.answer);
            for (let i = 0; lost && i < final_guess.length; i++) {
                if (final_guess[i].type_id === -1)
                    lost = false;
            }
        }
        return lost;
    }
    draw(canvas, ctx, xi, yi, render_width = this.width, render_height = this.height) {
        this.width = render_width;
        this.height = render_height;
        ctx.clearRect(xi, yi, render_width, render_height);
        ctx.imageSmoothingEnabled = false;
        const peg_selection_space = [render_width / 10, render_height];
        const width = Math.floor((render_width - peg_selection_space[0]) / this.choices_per_guess());
        const height = Math.floor((render_height) / this.guesses());
        {
            for (let i = this.guesses() - 1, y = 0; i >= 0; i--, y += height) {
                if (i < this.saved_guesses.length) {
                    for (let x = xi, j = 0; x < this.width; x += width, j++) {
                        if (this.saved_guesses[i][j] && this.is_answered(this.saved_guesses[i])) {
                            this.saved_guesses[i][j].draw_with_markup(canvas, ctx, this.answer, j, x, y, width, height);
                        }
                        else if (this.saved_guesses[i][j])
                            this.saved_guesses[i][j].draw(canvas, ctx, x, y, width, height);
                        else {
                            ctx.fillStyle = new RGB(125, 125, 125).htmlRBG();
                            ctx.strokeRect(x, y, width, height);
                            ctx.fillRect(x, y, width, height);
                        }
                    }
                }
                else {
                    ctx.fillStyle = new RGB(125, 125, 125).htmlRBG();
                    for (let x = xi, j = 0; j < this.choices_per_guess(); x += width, j++) {
                        ctx.strokeRect(x, y, width, height);
                        ctx.fillRect(x, y, width, height);
                    }
                }
                ctx.font = menu_font_size() + `px ${"Helvetica"}`;
                ;
                ctx.fillStyle = new RGB(255, 15, 15).htmlRBG();
                ctx.strokeStyle = "#000000";
                if (this.has_won()) {
                    let message = `Victory in ${this.saved_guesses.length} Guesses!`;
                    let message_width = ctx.measureText(message).width;
                    ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2);
                    ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2);
                    message = 'Game Over! Click to reset.';
                    message_width = ctx.measureText(message).width;
                    ctx.strokeText(message, this.width / 2 - message_width / 2, menu_font_size() + this.height / 2);
                    ctx.fillText(message, this.width / 2 - message_width / 2, menu_font_size() + this.height / 2);
                }
                else if (this.has_lost()) {
                    let message = `You've made ${this.saved_guesses.length} guesses, but still haven't won!`;
                    let message_width = ctx.measureText(message).width;
                    ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2);
                    ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2);
                    message = 'Game Over! Click to reset.';
                    message_width = ctx.measureText(message).width;
                    ctx.strokeText(message, this.width / 2 - message_width / 2, menu_font_size() + this.height / 2);
                    ctx.fillText(message, this.width / 2 - message_width / 2, menu_font_size() + this.height / 2);
                }
            }
            const y = (this.guesses() - this.saved_guesses.length - +(this.saved_guesses.length === 0)) * height;
            if (this.saved_guesses.length == 0) {
                for (let x = xi, j = 0; j < this.choices_per_guess(); x += width, j++) //show current row
                 {
                    ctx.strokeRect(x, y, width, height);
                    ctx.fillStyle = new RGB(250, 250, 250, 75).htmlRBGA();
                    ctx.fillRect(x, y, width, height);
                }
                ctx.font = menu_font_size() + `px ${"Helvetica"}`;
                ;
                ctx.fillStyle = new RGB(25, 255, 15).htmlRBG();
                ctx.strokeStyle = "#000000";
                let message = `There is a hidden answer made up of a combination of ${this.types} colors`;
                let message_width = ctx.measureText(message).width;
                let i = 0;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                message = `available in the selection tool on the right.`;
                message_width = ctx.measureText(message).width;
                i++;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                message = `You get ${this.guesses()} guesses as you guess`;
                message_width = ctx.measureText(message).width;
                i++;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                message = `the game will give you feedback, this works as follows:`;
                message_width = ctx.measureText(message).width;
                i++;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                message = `x means the color is not present`;
                message_width = ctx.measureText(message).width;
                i++;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                message = `o means you got the right color in the right place`;
                message_width = ctx.measureText(message).width;
                i++;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                message = `- means that the color is correct but the place is not`;
                message_width = ctx.measureText(message).width;
                i++;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                message = ``;
                message_width = ctx.measureText(message).width;
                i++;
                ctx.strokeText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
                ctx.fillText(message, this.width / 2 - message_width / 2, this.height / 2 + i * menu_font_size());
            }
        }
        const x = render_width - peg_selection_space[0];
        for (let i = 0, y = 0; i < this.types; i++, y += render_height / this.types) {
            const peg = new Peg(i);
            peg.draw(canvas, ctx, x, y, render_width - x, render_height / this.types);
            if (this.selected && peg.type_id === this.selected.type_id) {
                const width = this.width / 10;
                ctx.strokeStyle = new RGB(0, 0, 0, 125).htmlRBG();
                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.moveTo(x, y);
                ctx.lineTo(x + width, y + height);
                ctx.moveTo(x + width, y);
                ctx.lineTo(x, y + height);
                ctx.stroke();
            }
        }
        if (this.selected && !isTouchSupported())
            this.selected.draw(canvas, ctx, this.touchListener.touchPos[0] - width / 2, this.touchListener.touchPos[1] - height / 2, width, height);
    }
    update_state(delta_time) {
    }
}
async function main() {
    const canvas = document.getElementById("screen");
    const touchListener = new SingleTouchListener(canvas, false, true, false);
    const keyboardHandler = new KeyboardHandler();
    canvas.onmousemove = (event) => {
    };
    canvas.addEventListener("wheel", (e) => {
        //e.preventDefault();
    });
    canvas.width = getWidth();
    canvas.height = getHeight();
    canvas.style.cursor = "pointer";
    let counter = 0;
    const touchScreen = isTouchSupported();
    let height = getHeight();
    let width = getWidth();
    let game = new LogicField(touchListener, 4, 8, 8, height, width);
    touchListener.registerCallBack("touchstart", (event) => !game.has_won() && game.is_in_peg_selector(event.touchPos), (event) => {
        game.selected = game.get_peg(event.touchPos[1]);
    });
    let places_mod = 0;
    touchListener.registerCallBack("touchstart", (event) => true, (event) => {
        if (game.has_won())
            game = new LogicField(touchListener, game.choices_per_guess() + Math.floor(places_mod++ / 5), (game.types + 1 < 21 ? game.types + 1 : game.types), game.guesses(), game.height, game.width);
        else if (game.has_lost())
            game = new LogicField(touchListener, game.choices_per_guess(), game.types, game.guesses(), game.height, game.width);
        window.game = game;
    });
    touchListener.registerCallBack("touchend", (event) => !game.has_won() && !game.is_in_peg_selector(event.touchPos), (event) => {
        if (game.selected)
            game.try_to_place_peg(event.touchPos, game.selected);
    });
    window.game = game;
    let maybectx = canvas.getContext("2d");
    if (!maybectx)
        return;
    const ctx = maybectx;
    let start = Date.now();
    let dt = 1;
    const drawLoop = () => {
        dt = Date.now() - start;
        start = Date.now();
        //do stuff and render here
        game.width = getWidth();
        game.height = getHeight();
        if (game.width !== canvas.width || game.height !== canvas.height) {
            canvas.width = game.width;
            canvas.height = game.height - 25;
            game.width = canvas.width;
            game.height = canvas.height;
            //console.log(game.width, game.height);
        }
        game.draw(canvas, ctx, 0, 0);
        game.update_state(dt);
        requestAnimationFrame(drawLoop);
    };
    drawLoop();
}
main();
