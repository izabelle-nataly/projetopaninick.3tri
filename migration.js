const db = require("./db");

async function criarTabelas() {
    try {
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS cliente (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nome VARCHAR(100) NOT NULL,
                cpf CHAR(14) NOT NULL UNIQUE,
                celular CHAR(15) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                senha VARCHAR(255) NOT NULL
            )
        `);

        console.log("Migration executada com sucesso!");
    } catch (error) {
        console.error("Erro na migration:", error.message);
        throw error;
    }
}

module.exports = criarTabelas;