import AesDefender from "./aes-defender.js";

const [command, path] = process.argv.slice(2);

if (command && !path) {
    throw new Error('Argument "path" is required!')
}

const aesDefender = new AesDefender(path);

switch (command) {
    case '-p':
    case '--prepare':
        aesDefender.extendFile();
        aesDefender.makeDictionary();
        break;
    case '-e':
    case '--encode':
        aesDefender.encode();
        break;
    case '-d':
    case '--decode':
        aesDefender.decode();
        break;
    default:
        console.log("Usage: node index.js (-p | --prepare | -d | --decode | -e | --encode) path")
        break;
}

