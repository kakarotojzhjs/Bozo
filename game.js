// Importa o Firebase SDK do CDN oficial (versão 13.0.0 que o seu projeto usou)
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

// As suas chaves reais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDs_Yo2dJAJDGxFG1YyTfGAR6-0QafYFBE",
  authDomain: "cervido-ac1b8.firebaseapp.com",
  projectId: "cervido-ac1b8",
  storageBucket: "cervido-ac1b8.firebasestorage.app",
  messagingSenderId: "990591462025",
  appId: "1:990591462025:web:5f1bfd389d6b9e23213458",
  measurementId: "G-BMWXY909NP"
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

    // Regista o jogador no Firebase
    const jogadorRef = ref(db, `salas/${minhaSala}/jogadores/${meuIdUnico}`);
    set(jogadorRef, {
        nome: meuNome,
        time: meuTime,
        avatar: '🧸'
    });

    // Remove da sala se fechar o site
    onDisconnect(jogadorRef).remove();

    ouvirSalaFirebase();
};

function ouvirSalaFirebase() {
    const salaRef = ref(db, `salas/${minhaSala}`);

    onValue(salaRef, (snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;

        // Atualiza a lista de bonequinhos online
        const listaUI = document.getElementById('lista-jogadores');
        listaUI.innerHTML = '';
        
        if (dados.jogadores) {
            Object.values(dados.jogadores).forEach(j => {
                let li = document.createElement('li');
                li.innerHTML = `🧸 <b>${j.nome}</b> (${j.time})`;
                listaUI.appendChild(li);
            });
        }

        // Atualiza os dados globais na tela se já foram jogados
        if (dados.estadoDados) {
            atualizarVisualDados(dados.estadoDados.t1, dados.estadoDados.t2, dados.estadoDados.num);
        }
    });
}

window.rodarDadosGlobais = function() {
    // Sistema sorteia os 3 dados automaticamente para todos da sala
    let t1 = Math.floor(Math.random() * 4) + 1;
    let t2 = Math.floor(Math.random() * 4) + 1;
    let num = Math.floor(Math.random() * 6) + 1;

    const estadoRef = ref(db, `salas/${minhaSala}/estadoDados`);
    set(estadoRef, { t1, t2, num });
};

function atualizarVisualDados(t1, t2, num) {
    const nomesTimes = { 1: "Corinthians", 2: "Palmeiras", 3: "Flamengo", 4: "Grêmio" };

    document.getElementById('dado-t1').innerText = `T${t1}`;
    document.getElementById('dado-t2').innerText = `T${t2}`;
    document.getElementById('dado-num').innerText = num;
    
    document.getElementById('status-jogo').innerText = 
        `Resultado Global: Time 1 (${nomesTimes[t1]}) + Time 2 (${nomesTimes[t2]}) | Número: ${num}`;

    document.querySelectorAll('.num-celula').forEach(c => c.style.background = '#f9e79f');
    let celulaAtiva = document.getElementById(`cel-${num}`);
    if (celulaAtiva) {
        celulaAtiva.style.background = '#ff5722';
        celulaAtiva.style.color = '#fff';
    }
}
