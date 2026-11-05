//Buscar por nome: http://localhost:3000/produto?nome=processador

//Filtrar por categoria: http://localhost:3000/produto?categoria=processador

//Filtrar por faixa de preço: http://localhost:3000/produto?preco_min=200&preco_max=700

//Ordenar do menor para o maior preço: http://localhost:3000/produto?ordem=asc

//Ordenar do maior para o menor preço: http://localhost:3000/produto?ordem=desc

//Navegar pelas páginas (Página 2): http://localhost:3000/produto?pagina=2

//Combinar múltiplos filtros: `




const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");

const app = express();
const port = 3000;

const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_super_segura";

app.use(cors());
app.use(express.json());

// GET - Listar produtos e filtrar por preço (?min=X&max=Y)
app.get("/produtos", async (req, res) => {
    try {
        const { min, max } = req.query;
        let sql = "SELECT * FROM produtos";
        let valores = [];

        if (min !== undefined && max !== undefined) {
            sql += " WHERE preco >= ? AND preco <= ?";
            valores = [Number(min), Number(max)];
        }

        const [resultado] = await pool.query(sql, valores);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// GET - Buscar produto por ID
app.get("/produtos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await pool.query("SELECT * FROM produtos WHERE id = ?", [id]);

        if (resultado.length === 0) {
            return res.status(404).json({ mensagem: "Produto não encontrado" });
        }

        res.status(200).json(resultado[0]);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// POST - Cadastrar usuário
app.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: "Todos os campos são obrigatórios." });
        }

        const [existente] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (existente.length > 0) {
            return res.status(400).json({ mensagem: "E-mail já cadastrado." });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        await pool.query("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)", [
            nome,
            email,
            senhaHash
        ]);

        res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// POST - Login do usuário
app.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        const [usuarios] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (usuarios.length === 0) {
            return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }

        const usuario = usuarios[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token,
            nome: usuario.nome
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});
