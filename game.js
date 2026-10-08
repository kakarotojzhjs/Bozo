let meuNome = "";
let minhaSala = "";

function entrarSala() {
    meuNome = document.getElementById('nome-jogador').value;
    minhaSala = document.getElementById('codigo-sala').value;

    if (!meuNome || !minhaSala) {
        alert("Preencha o nome e a sala!");
        return;
    }

    document.getElementById('sala-container').style.display = 'none';
    document.getElementById('jogo-container').style.display = 'block';
    document.getElementById('span-sala').innerText = minhaSala;
    document.getElementById('vez-jogador').innerText = `Jogador: ${meuNome} pronto na mesa!`;
}

function jogarDadosTabuleiro() {
    // Simula os 3 dados da mesa
    // 2 dados de times (ex: sorteia valores de 1 a 4 para escolher o time)
    let t1 = Math.floor(Math.random() * 4) + 1;
    let t2 = Math.floor(Math.random() * 4) + 1;
    
    // 1 dado numérico de 1 a 6 (igualzinho ao da coluna do tabuleiro)
    let numSorteado = Math.floor(Math.random() * 6) + 1;

    // Mostra nos elementos visuais dos dados
    document.getElementById('dado-t1').innerText = `T${t1}`;
    document.getElementById('dado-t2').innerText = `T${t2}`;
    document.getElementById('dado-num').innerText = numSorteado;

    // Destaca visualmente a célula do número correspondente no tabuleiro
    document.querySelectorAll('.num-celula').forEach(c => c.style.background = '#f9e79f');
    let celulaAtiva = document.getElementById(`cel-${numSorteado}`);
    if (celulaAtiva) {
        celulaAtiva.style.background = '#ff5722'; // Cor de destaque na aposta
        celulaAtiva.style.color = '#fff';
    }

    document.getElementById('vez-jogador').innerText = `${meuNome} lançou! Caiu no Número ${numSorteado}!`;
}
