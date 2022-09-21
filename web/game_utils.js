import { isTouchSupported } from './io.js';
export function menu_font_size() { return isTouchSupported() ? 27 : 22; }
export function distance(a, b) {
    const dx = a.mid_x() - b.mid_x();
    const dy = a.mid_y() - b.mid_y();
    return Math.sqrt(dx * dx + dy * dy);
}
export function manhattan_distance(a, b) {
    const dx = Math.abs(a.mid_x() - b.mid_x());
    const dy = Math.abs(a.mid_y() - b.mid_y());
    return dx + dy;
}
;
;
;
;
export class SquareAABBCollidable {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    max_width() { return this.width; }
    max_height() { return this.height; }
    check_collision(other) {
        return this.x < other.x + other.width && other.x < this.x + this.width &&
            this.y < other.y + other.height && other.y < this.y + this.height;
    }
    check_collision_gui(other, x, y) {
        return this.x < x + other.width() && x < this.x + this.width &&
            this.y < y + other.height() && y < this.y + this.height;
    }
    get_normalized_direction_vector(other) {
        const dy = -this.mid_y() + other.mid_y();
        const dx = -this.mid_x() + other.mid_x();
        const dist = Math.sqrt(dy * dy + dx * dx);
        const norm_dy = dy / dist;
        const norm_dx = dx / dist;
        return [dx / dist, dy / dist];
    }
    dim() {
        return [this.x, this.y, this.width, this.height];
    }
    mid_x() {
        return this.x + this.width / 2;
    }
    mid_y() {
        return this.y + this.height / 2;
    }
}
;
export class Cell {
    constructor() {
        this.collidable_objects = [];
    }
    push_collidable(object) {
        this.collidable_objects.push(object);
    }
}
;
export class SpatialHashMap2D {
    constructor(collidables, screen_width, screen_height, cells_vertical, cells_horizontal) {
        this.data = [];
        const sq_dim = 20;
        for (let i = 0; i < cells_vertical * cells_horizontal; i++) {
            this.data.push(new Cell());
        }
        for (let i = 0; i < collidables.length; i++) {
            const collidable = collidables[i];
            const dx = Math.ceil(collidable.max_width() / screen_width * cells_horizontal);
            const dy = Math.ceil(collidable.max_height() / screen_height * cells_vertical);
            {
                const grid_x = Math.floor((collidable.x) / screen_width * cells_horizontal);
                const grid_y = Math.floor((collidable.y) / screen_height * cells_vertical);
                for (let y = 0; y < dy; y++) {
                    for (let x = 0; x < dx; x++) {
                        const cell = this.data[grid_x + x + (grid_y + y) * cells_horizontal];
                        if (cell)
                            cell.push_collidable(collidable);
                    }
                }
            }
        }
    }
    handle_by_cell(callback) {
        for (let i = 0; i < this.data.length; i++) {
            this.handle_cell(i, callback);
        }
    }
    handle_cell(index, callback) {
        const cell = this.data[index];
        const collidables = cell.collidable_objects;
        for (let i = 0; i < collidables.length; i++) {
            const collidable = collidables[i];
            for (let j = 0; j < collidables.length; j++) {
                const collidable2 = collidables[j];
                if (collidable2.check_collision(collidable)) {
                    callback(collidable, collidable2);
                }
            }
        }
    }
}
;
