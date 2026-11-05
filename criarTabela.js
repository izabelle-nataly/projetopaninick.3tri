const { pool } = require("./db");

async function criarTabela() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                senha VARCHAR(255) NOT NULL
            );
        `;
        await pool.query(sql);
        console.log("Tabela 'usuarios' criada com sucesso!");
    } catch (error) {
        console.error("Erro ao criar a tabela:", error.message);
    } finally {
        process.exit();
    }
}

criarTabela();
