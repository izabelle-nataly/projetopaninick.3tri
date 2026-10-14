const API = "http://localhost:3000";

// Mostra uma mensagem na tela
function mostrarMensagem(texto, tipo) {
    const elemento = document.getElementById("mensagem");

    if (!elemento) return;

    elemento.textContent = texto;
    elemento.className = "mensagem " + tipo;
}

// Encerra a sessão
function logout() {
    localStorage.removeItem("nome_cliente");
    localStorage.removeItem("token");

    window.location.href = "login.html";
}

// Carrega os dados do perfil usando o token
async function carregarPerfil() {
    const token = localStorage.getItem("token");
    const nome = localStorage.getItem("nome_cliente");

    if (!token || !nome) {
        window.location.href = "login.html";
        return;
    }

    const area = document.getElementById("perfil-info");

    try {
        const resposta = await fetch(`${API}/cliente/perfil`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.msg || "Não foi possível carregar o perfil.");
        }

        area.innerHTML = "";

        const campos = [
            ["Nome", dados.nome],
            ["CPF", dados.cpf],
            ["Celular", dados.celular],
            ["Email", dados.email]
        ];

        campos.forEach(([titulo, valor]) => {
            const paragrafo = document.createElement("p");
            const rotulo = document.createElement("strong");

            rotulo.textContent = titulo + ": ";
            paragrafo.appendChild(rotulo);
            paragrafo.appendChild(document.createTextNode(valor));

            area.appendChild(paragrafo);
        });
    } catch (error) {
        area.textContent = error.message;

        if (error.message.includes("Token")) {
            logout();
        }
    }
}
