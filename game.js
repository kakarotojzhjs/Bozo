// Importa o Firebase SDK do CDN oficial
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ⚠️ COLOQUE AQUI AS SUAS CREDENCIAIS REAIS DO SEU FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SEU_APP_ID"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let meuNome = "";
let minhaSala = "";
let meuTime = "";
let meuIdUnico = "user_" + Math.random().toString(36).substr(2, 9);

window.entrarNaMesa = function() {
    meuNome = document.getElementById('nome-jogador').value.trim();
    minhaSala = document.getElementById('codigo-sala').value.trim();
    meuTime = document.getElementById('select-time').value;

    if (!meuNome || !minhaSala) {
        alert("Preencha o seu nome e o código da sala!");
        return;
    }

    document.getElementById('sala-container').style.display = 'none';
    document.getElementById('jogo-container').style.display = 'block';
    document.getElementById('span-sala').innerText = minhaSala;

    // Regista o jogador no Firebase Realtime Database
    const jogadorRef = ref(db, `salas/${minhaSala}/jogadores/${meuIdUnico}`);
    set(jogadorRef, {
        nome: meuNome,
        time: meuTime,
        avatar: '🧸' // Bonequinho identificador
    });

    // Remove o jogador automaticamente se ele fechar a página
    onDisconnect(jogadorRef).remove();

    // Ouve em tempo real quem está na sala
    ouvirSalaFirebase();
};

function ouvirSalaFirebase() {
    const salaRef = ref(db, `salas/${minhaSala}`);

    onValue(salaRef, (snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;

        // Atualiza a lista de bonequinhos/jogadores na tela
        const listaUI = document.getElementById('lista-jogadores');
        listaUI.innerHTML = '';
        
        if (dados.jogadores) {
            Object.values(dados.jogadores).forEach(j => {
                let li = document.createElement('li');
                li.innerHTML = `🧸 <b>${j.nome}</b> (${j.time})`;
                listaUI.appendChild(li);
            });
        }

        // Atualiza os dados globais do tabuleiro se já foram sorteados
        if (dados.estadoDados) {
            atualizarVisualDados(dados.estadoDados.t1, dados.estadoDados.t2, dados.estadoDados.num);
        }
    });
}

window.rodarDadosGlobais = function() {
    // Sorteia os 3 dados globais automaticamente
    let t1 = Math.floor(Math.random() * 4) + 1;
    let t2 = Math.floor(Math.random() * 4) + 1;
    let num = Math.floor(Math.random() * 6) + 1;

    // Envia o resultado global para o Firebase (atualiza para todos na mesma sala instantaneamente)
    const estadoRef = ref(db, `salas/${minhaSala}/estadoDados`);
    set(estadoRef, { t1, t2, num });
};

function atualizarVisualDados(t1, t2, num) {
    // Traduz o número do time sorteado para o nome do time correspondente
    const nomesTimes = { 1: "Corinthians", 2: "Palmeiras", 3: "Flamengo", 4: "Grêmio" };

    document.getElementById('dado-t1').innerText = `T${t1}`;
    document.getElementById('dado-t2').innerText = `T${t2}`;
    document.getElementById('dado-num').innerText = num;
    
    document.getElementById('status-jogo').innerText = 
        `Resultado Global: Time 1 (${nomesTimes[t1]}) + Time 2 (${nomesTimes[t2]}) | Número do Tabuleiro: ${num}`;

    // Destaca a célula vencedora no tabuleiro de lona
    document.querySelectorAll('.num-celula').forEach(c => c.style.background = '#f9e79f');
    let celulaAtiva = document.getElementById(`cel-${num}`);
    if (celulaAtiva) {
        celulaAtiva.style.background = '#ff5722';
        celulaAtiva.style.color = '#fff';
    }
}
    
