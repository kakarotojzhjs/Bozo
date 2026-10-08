// Variável para guardar o estado do socket (ligação em tempo real)
let socket = null;
let dadosValores = [1, 2, 3, 4, 5];
let dadosSegurados = [false, false, false, false, false];
let tentativasRestantes = 3;

function entrarSala() {
    const nome = document.getElementById('nome-jogador').value;
    const sala = document.getElementById('codigo-sala').value;

    if (!nome || !sala) {
        alert("Por favor, preencha o seu nome e o código da sala!");
        return;
    }

    // Esconde a tela de login e mostra a tela do jogo
    document.getElementById('sala-container').style.display = 'none';
    document.getElementById('jogo-container').style.display = 'block';
    document.getElementById('span-sala').innerText = sala;
    document.getElementById('vez-jogador').innerText = `Bem-vindo, ${nome}! Aguardando o servidor...`;

    // Aqui fazemos a conexão com o servidor de teste (fase seguinte)
    // socket = io('URL_DO_SEU_SERVIDOR_AQUI');
}

function toggleSegurar(indice) {
    dadosSegurados[indice] = !dadosSegurados[indice];
    const elementoDado = document.querySelectorAll('.dado')[indice];
    
    if (dadosSegurados[indice]) {
        elementoDado.classList.add('segurado');
    } else {
        elementoDado.classList.remove('segurado');
    }
}

function rolarDados() {
    if (tentativasRestantes <= 0) return;

    for (let i = 0; i < 5; i++) {
        if (!dadosSegurados[i]) {
            dadosValores[i] = Math.floor(Math.random() * 6) + 1;
        }
    }

    // Atualiza os números visuais nos dados
    const elementosDados = document.querySelectorAll('.dado');
    elementosDados.forEach((el, index) => {
        el.innerText = dadosValores[index];
    });

    tentativasRestantes--;
    document.getElementById('btn-rolar').innerText = `Rolar Dados (${tentativasRestantes})`;

    if (tentativasRestantes === 0) {
        document.getElementById('btn-rolar').disabled = true;
        document.getElementById('btn-rolar').style.backgroundColor = '#ccc';
    }
}
  
