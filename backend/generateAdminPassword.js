const bcrypt = require("bcryptjs");

async function generateHash() {
    const password = "Mutare1998";

    const hash = await bcrypt.hash(password, 10);

    console.log(hash);
}

generateHash();