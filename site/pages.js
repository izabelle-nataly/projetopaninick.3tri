const API_URL = "http://localhost:3000";

// --- CADASTRAR USUÁRIO ---
const formCadastro = document.getElementById("formCadastro");
if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        try {
            const res = await fetch(`${API_URL}/cadastro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Cadastro realizado com sucesso! Faça login.");
                window.location.href = "login.html";
            } else {
                alert(data.mensagem || "Erro ao cadastrar.");
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    });
}

// --- LOGIN DO USUÁRIO ---
const formLogin = document.getElementById("formLogin");
if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();

            if (res.ok) {
                // Salva no LocalStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("nome", data.nome);

                alert(`Bem-vindo(a), ${data.nome}!`);
                window.location.href = "index.html";
            } else {
                alert(data.mensagem || "Erro ao realizar login.");
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        }
    });
}

// --- VERIFICAR LOGIN NA PÁGINA PRINCIPAL ---
document.addEventListener("DOMContentLoaded", () => {
    const usuarioLogadoSpan = document.getElementById("usuarioLogado");
    const nomeStorage = localStorage.getItem("nome");

    if (usuarioLogadoSpan && nomeStorage) {
        usuarioLogadoSpan.innerText = `Olá, ${nomeStorage}!`;
    }
});
