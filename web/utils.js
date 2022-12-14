;
export function normalize(vec) {
    const mag = Math.sqrt(vec[0] * vec[0] + vec[1] + vec[1]);
    return [vec[0] / mag, vec[1] / mag];
}
export function scalarDotProduct(a, b) {
    return a[0] * b[0] + a[1] * b[1];
}
export function get_angle(deltaX, deltaY, unit_vectorX = 1, unit_vectorY = 0) {
    const a = normalize([deltaX, deltaY]);
    const b = [unit_vectorX, unit_vectorY];
    const dotProduct = scalarDotProduct(a, b);
    return Math.acos(dotProduct) * (deltaY < 0 ? 1 : -1);
}
export function threeByThreeMat(a, b) {
    return [a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
        a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
        a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
        a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
        a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
        a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
        a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
        a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
        a[6] * b[2] + a[7] * b[5] + a[8] * b[8]];
}
export function matByVec(mat, vec) {
    return [mat[0] * vec[0] + mat[1] * vec[1] + mat[2] * vec[2],
        mat[3] * vec[0] + mat[4] * vec[1] + mat[5] * vec[2],
        mat[6] * vec[0] + mat[7] * vec[1] + mat[8] * vec[2]];
}
export class Queue {
    constructor() {
        this.data = [];
        this.data.length = 64;
        this.start = 0;
        this.end = 0;
        this.length = 0;
    }
    push(val) {
        if (this.length === this.data.length) {
            const newData = [];
            newData.length = this.data.length * 2;
            for (let i = 0; i < this.data.length; i++) {
                newData[i] = this.data[(i + this.start) % this.data.length];
            }
            this.start = 0;
            this.end = this.data.length;
            this.data = newData;
            this.data[this.end++] = val;
            this.length++;
        }
        else {
            this.data[this.end++] = val;
            this.end &= this.data.length - 1;
            this.length++;
        }
    }
    pop() {
        if (this.length) {
            const val = this.data[this.start];
            this.start++;
            this.start &= this.data.length - 1;
            this.length--;
            return val;
        }
        throw new Error("No more values in the queue");
    }
    get(index) {
        if (index < this.length) {
            return this.data[(index + this.start) & (this.data.length - 1)];
        }
        throw new Error(`Could not get value at index ${index}`);
    }
    set(index, obj) {
        if (index < this.length) {
            this.data[(index + this.start) & (this.data.length - 1)] = obj;
        }
        throw new Error(`Could not set value at index ${index}`);
    }
}
;
export class FixedSizeQueue {
    constructor(size) {
        this.data = [];
        this.data.length = size;
        this.start = 0;
        this.end = 0;
        this.length = 0;
    }
    push(val) {
        if (this.length === this.data.length) {
            this.start++;
            this.data[this.end++] = val;
            this.start &= this.data.length - 1;
            this.end &= this.data.length - 1;
        }
        else {
            this.data[this.end++] = val;
            this.end &= this.data.length - 1;
            this.length++;
        }
    }
    pop() {
        if (this.length) {
            const val = this.data[this.start];
            this.start++;
            this.start &= this.data.length - 1;
            this.length--;
            return val;
        }
        throw new Error("No more values in the queue");
    }
    get(index) {
        if (index < this.length) {
            return this.data[(index + this.start) & (this.data.length - 1)];
        }
        throw new Error(`Could not get value at index ${index}`);
    }
    set(index, obj) {
        if (index < this.length) {
            this.data[(index + this.start) & (this.data.length - 1)] = obj;
        }
        throw new Error(`Could not set value at index ${index}`);
    }
}
;
export class RollingStack {
    constructor(size = 75) {
        this.data = [];
        this.start = 0;
        this.end = 0;
        this.reserve = size;
        this.size = 0;
        for (let i = 0; i < size; i++)
            this.data.push();
    }
    empty() {
        this.start = 0;
        this.end = 0;
        this.size = 0;
    }
    length() {
        return this.size;
    }
    pop() {
        if (this.size) {
            this.size--;
            this.end--;
            if (this.end < 0)
                this.end = this.reserve - 1;
            return this.data[this.end];
        }
        return null;
    }
    push(val) {
        if (this.size >= this.reserve) {
            this.start++;
            this.start %= this.reserve;
            this.size--;
        }
        this.size++;
        this.data[this.end++] = val;
        this.end %= this.reserve;
    }
    set(index, obj) {
        this.data[(this.start + index) % this.reserve] = obj;
    }
    get(index) {
        return this.data[(this.start + index) % this.reserve];
    }
}
;
export class DynamicInt32Array {
    constructor(size = 4096) {
        this.data = new Int32Array(size);
        this.len = 0;
    }
    length() {
        return this.len;
    }
    push(value) {
        if (this.data.length <= this.length()) {
            const temp = new Int32Array(this.data.length * 2);
            for (let i = 0; i < this.data.length; i++) {
                temp[i] = this.data[i];
            }
            this.data = temp;
        }
        this.data[this.len++] = value;
    }
    trimmed() {
        const data = new Int32Array(this.length());
        for (let i = 0; i < data.length; i++)
            data[i] = this.data[i];
        return data;
    }
}
;
export function toInt32Array(data) {
    const newData = new Int32Array(data.length);
    for (let i = 0; i < data.length; i++) {
        newData[i] = data[i];
    }
    return newData;
}
export async function fetchImage(url) {
    const img = new Image();
    img.src = URL.createObjectURL(await (await fetch(url)).blob());
    return img;
}
export async function logBinaryToServer(data, path) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", path, false);
    xhr.send(data);
}
export async function logToServer(data, path) {
    const res = await fetch(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    const json = await res.json();
    return json;
}
export async function readFromServer(path) {
    const data = await fetch(path, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return await data.json();
}
export function saveBlob(blob, fileName) {
    const a = document.createElement("a");
    if (blob) {
        a.href = window.URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
    }
}
export const max_32_bit_signed = Math.pow(2, 31);
export let rand_state = 34;
export function srand(seed) {
    rand_state = seed;
}
export function random() {
    rand_state *= 1997;
    rand_state ^= rand_state << 5;
    rand_state ^= rand_state >> 18;
    rand_state *= 1997;
    rand_state ^= rand_state << 7;
    rand_state = Math.abs(rand_state);
    return (rand_state) * 1 / max_32_bit_signed;
}
export function findLeastUsedDoubleWord(buffer) {
    const useCount = new Map();
    for (let i = 0; i < buffer.length; i++) {
        if (useCount.get(buffer[i]))
            useCount.set(buffer[i], (useCount.get(buffer[i]) !== undefined ? useCount.get(buffer[i]) : 0) + 1);
        else
            useCount.set(buffer[i], 1);
    }
    let minValue = useCount.values().next().value;
    let minUsedKey = useCount.keys().next().value;
    for (const [key, value] of useCount.entries()) {
        if (value < minValue) {
            minUsedKey = key;
            minValue = value;
        }
    }
    let random = Math.floor(Math.random() * 1000000000);
    for (let i = 0; i < 1000; i++) {
        if (!useCount.get(random))
            break;
        const newRandom = Math.floor(random * Math.random() * (1 + 10 * (i % 2)));
        if (useCount.get(newRandom) < useCount.get(random))
            random = newRandom;
    }
    if (!useCount.get(random) || useCount.get(random) < useCount.get(minUsedKey))
        return random;
    else
        return minUsedKey;
}
export function rleEncode(buffer) {
    const flag = findLeastUsedDoubleWord(buffer);
    const data = [];
    data.push(flag);
    for (let i = 0; i < buffer.length;) {
        const value = buffer[i];
        let currentCount = 1;
        while (buffer[i + currentCount] === value)
            currentCount++;
        if (currentCount > 2 || value === flag) {
            data.push(flag);
            data.push(value);
            data.push(currentCount);
            i += currentCount;
        }
        else {
            data.push(value);
            i++;
        }
    }
    return toInt32Array(data);
}
export function rleDecode(encodedBuffer) {
    const data = [];
    const flag = encodedBuffer[0];
    for (let i = 1; i < encodedBuffer.length;) {
        if (encodedBuffer[i] !== flag)
            data.push(encodedBuffer[i]);
        else {
            const value = encodedBuffer[++i];
            const count = encodedBuffer[++i];
            for (let j = 0; j < count; j++)
                data.push(value);
        }
        i++;
    }
    return toInt32Array(data);
}
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function changeFavicon(src) {
    let link = document.createElement('link'), oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    if (oldLink) {
        document.head.removeChild(oldLink);
    }
    document.head.appendChild(link);
}
