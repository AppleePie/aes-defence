import fs from 'fs';
import aes from 'aes-js';

const MIN_BYTE = 0;
const MAX_BYTE = 255;

class AesDefender {
    get zeros() {
        return [...Array(this.zerosCount).keys()].map(() => 0);
    }

    get dictionaryPath() {
        return `${this.path}-dictionary`;
    }

    get tablePath() {
        return `${this.path}-table.txt`;
    }

    get aesEncoder() {
        const key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        return new aes.ModeOfOperation.ecb(key);
    }

    constructor(path) {
        this.zerosCount = 15;
        this.path = path;

        if (!fs.existsSync(this.path)) {
            throw new Error('File should be exist');
        }
    }

    extendFile() {
        const fileContent = fs.readFileSync(this.path);
        const bytes = [];

        for (let i = 0; i < fileContent.byteLength; i++) {
            bytes.push(...this.zeros);
            bytes.push(fileContent[i]);
        }

        fs.writeFileSync(this.path, Buffer.from(bytes));
    }
     
    makeDictionary() {
        const bytes = [];

        for (let i = MIN_BYTE; i <= MAX_BYTE; i++) {
            bytes.push(...this.zeros);
            bytes.push(i);
        }

        fs.writeFileSync(this.dictionaryPath, Buffer.from(bytes));
    }

    encode() {
        if (!fs.existsSync(this.path)) {
            throw new Error('File is not exists!');
        }

        if (!fs.existsSync(this.dictionaryPath)) {
            throw new Error('Dictionary for file is not exists!');
        }

        const fileContent = fs.readFileSync(this.path);
        const dictionaryContent = fs.readFileSync(this.dictionaryPath);

        const encryptedBytes = this.aesEncoder.encrypt(fileContent);
        const encryptedDictionaryBytes = this.aesEncoder.encrypt(dictionaryContent);

        fs.writeFileSync(this.path, Buffer.from(encryptedBytes));
        fs.writeFileSync(this.dictionaryPath, Buffer.from(encryptedDictionaryBytes));
    }

    translate() {
        const encryptedToSourceMap = this.#getSourceByEncryptedByteMap();
        const fileContent = [];

        for (const [encryptedByteBlockHex, sourceByte] of encryptedToSourceMap) {
            const sourceByteHex = aes.utils.hex.fromBytes(new Uint8Array([sourceByte]));
            fileContent.push(`${encryptedByteBlockHex} -> ${sourceByteHex}`)
        }

        fs.writeFileSync(this.tablePath, fileContent.join('\n'), { encoding: 'utf-8' });
    }

    decode() {
        if (!fs.existsSync(this.path)) {
            throw new Error('File is not exists!');
        }

        const fileContent = fs.readFileSync(this.path);
        const encryptedToSourceMap = this.#getSourceByEncryptedByteMap();

        const bytes = [];

        for (let i = 0; i < fileContent.byteLength; i += (this.zerosCount + 1)) {
            const encryptedBytesBlock = fileContent.slice(i, i + (this.zerosCount + 1));
            const encryptedBytesHex = aes.utils.hex.fromBytes(encryptedBytesBlock);

            const sourceByte = encryptedToSourceMap.get(encryptedBytesHex);

            bytes.push(sourceByte);
        }

        fs.writeFileSync(this.path, Buffer.from(bytes));
    }

    #getSourceByEncryptedByteMap() {
        if (!fs.existsSync(this.dictionaryPath)) {
            throw new Error('Dictionary for file is not exists!');
        }

        const map = new Map();
        const dictionaryContent = fs.readFileSync(this.dictionaryPath);

        let sourceByte = MIN_BYTE;

        for (let i = 0; i < dictionaryContent.byteLength; i += (this.zerosCount + 1)) {
            const encryptedBytesBlock = dictionaryContent.slice(i, i + (this.zerosCount + 1));
            const encryptedBytesHex = aes.utils.hex.fromBytes(encryptedBytesBlock);

            map.set(encryptedBytesHex, sourceByte);

            sourceByte += 1;
        }

        return map;
    }
}

export default AesDefender;