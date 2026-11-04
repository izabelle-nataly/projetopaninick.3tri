require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const db = require("./db");
const criarTabelas = require("./migration");

const app = express();
const port = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

// CADASTRAR CLIENTE
app.post("/cliente", async (req, res) => {
    try {
        const { nome, cpf, celular, email, senha } = req.body;

        if (!nome || !cpf || !celular || !email || !senha) {
            return res.status(400).json({
                msg: "Preencha todos os campos."
            });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const [resultado] = await db.pool.query(
            `INSERT INTO cliente
            (nome, cpf, celular, email, senha)
            VALUES (?, ?, ?, ?, ?)`,
            [nome, cpf, celular, email, senhaCriptografada]
        );

        res.status(201).json({
            msg: "Cliente cadastrado com sucesso!",
            id: resultado.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                msg: "Este CPF ou email já está cadastrado."
            });
        }

        console.error(error);
        res.status(500).json({
            msg: "Erro ao cadastrar cliente."
        });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                msg: "Informe o email e a senha."
            });
        }

        const [resultado] = await db.pool.query(
            "SELECT id, nome, email, senha FROM cliente WHERE email = ?",
            [email]
        );

        const cliente = resultado[0];

        if (!cliente) {
            return res.status(401).json({
                msg: "Email ou senha inválidos."
            });
        }

        const senhaValida = await bcrypt.compare(
            senha,
            cliente.senha
        );

        if (!senhaValida) {
            return res.status(401).json({
                msg: "Email ou senha inválidos."
            });
        }

        const token = jwt.sign(
            {
                id: cliente.id,
                email: cliente.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.status(200).json({
            nome: cliente.nome,
            token: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Erro ao realizar login."
        });
    }
});

// AUTENTICAÇÃO DO TOKEN
function autenticar(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            msg: "Token não enviado."
        });
    }

    const token = authorization.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (error, usuario) => {
        if (error) {
            return res.status(403).json({
                msg: "Token inválido ou expirado."
            });
        }

        req.usuario = usuario;
        next();
    });
}

// PERFIL PROTEGIDO
app.get("/cliente/perfil", autenticar, async (req, res) => {
    try {
        const [resultado] = await db.pool.query(
            `SELECT id, nome, cpf, celular, email
             FROM cliente
             WHERE id = ?`,
            [req.usuario.id]
        );

        if (resultado.length === 0) {
            return res.status(404).json({
                msg: "Cliente não encontrado."
            });
        }

        res.status(200).json(resultado[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Erro ao buscar perfil."
        });
    }
});

// ROTA DE PRODUTOS COM FILTROS, ORDENAÇÃO E PAGINAÇÃO
app.get("/produto", async (req, res) => {
    try {
        const { nome, categoria, preco_min, preco_max, ordem, pagina } = req.query;

        let sql = "SELECT * FROM produto WHERE 1=1";
        const params = [];

        // 1. Filtro por nome
        if (nome) {
            sql += " AND nome LIKE ?";
            params.push(`%${nome}%`);
        }

        // 2. Filtro por categoria
        if (categoria) {
            sql += " AND categoria = ?";
            params.push(categoria);
        }

        // 3. Filtro por preço mínimo
        if (preco_min) {
            sql += " AND preco >= ?";
            params.push(Number(preco_min));
        }

        // 4. Filtro por preço máximo
        if (preco_max) {
            sql += " AND preco <= ?";
            params.push(Number(preco_max));
        }

        // 5. Ordenação por menor ou maior preço
        if (ordem === "asc") {
            sql += " ORDER BY preco ASC";
        } else if (ordem === "desc") {
            sql += " ORDER BY preco DESC";
        } else {
            sql += " ORDER BY id DESC"; // Ordenação padrão por ID
        }

        // 6. Paginação (Fixado em 10 itens por página)
        const limite = 10;
        const numPagina = Math.max(1, parseInt(pagina) || 1);
        const offset = (numPagina - 1) * limite;

        sql += ` LIMIT ${limite} OFFSET${offset}`;

        const [produtos] = await db.pool.query(sql, params);

        res.status(200).json({
            pagina: numPagina,
            limite: limite,
            quantidade: produtos.length,
            produtos: produtos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: "Erro ao buscar produtos."
        });
    }
});

// EXECUTA A MIGRATION ANTES DE ABRIR A API
async function iniciarServidor() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("Configure JWT_SECRET no arquivo .env");
        }

        await criarTabelas();

        app.listen(port, () => {
            console.log(`API rodando em http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Não foi possível iniciar a API:", error.message);
        process.exitCode = 1;
        await db.pool.end();
    }
}

iniciarServidor();
