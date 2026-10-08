import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDs_Yo2dJAJDGxFG1YyTfGAR6-0QafYFBE",
  authDomain: "cervido-ac1b8.firebaseapp.com",
  projectId: "cervido-ac1b8",
  storageBucket: "cervido-ac1b8.firebasestorage.app",
  messagingSenderId: "990591462025",
  appId: "1:990591462025:web:5f1bfd389d6b9e23213458",
  measurementId: "G-BMWXY909NP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let meuNome = "";
let minhaSala = "";
let meuIdUnico = "user_" + Math.random().toString(36).substr(2, 9);
let meuSaldo = 1000;
let minhasApostas = {}; 

let timeSelecionadoModal = "";
let numeroSelecionadoModal = null;

window.entrarNaMesa = function() {
    meuNome = document.getElementById('nome-jogador').value.trim();
    minhaSala = document.getElementById('codigo-sala').value.trim();

    if (!meuNome || !minhaSala) {
        alert("Preencha o seu nome e o código da sala!");
        return;
    }

    document.getElementById('sala-container').style.display = 'none';
    document.getElementById('jogo-container').style.display = 'block';
    document.getElementById('span-sala').innerText = minhaSala;

    const jogadorRef = ref(db, `salas/${minhaSala}/jogadores/${meuIdUnico}`);
    set(jogadorRef, {
        nome: meuNome,
        saldo: meuSaldo,
        pronto: false,
        apostas: {}
    });

    onDisconnect(jogadorRef).remove();
    ouvirSalaFirebase();
};

window.abrirPainelAposta = function(time, numero) {
    // Só deixa apostar se a rodada ainda não tiver sido sorteada
    const salaRef = ref(db, `salas/${minhaSala}/estadoDados`);
    onValue(salaRef, (snapshot) => {
        if (snapshot.exists()) {
            alert("Aguarde a nova rodada comear para apostar!");
            return;
        }
    }, { onlyOnce: true });

    timeSelecionadoModal = time;
    numeroSelecionadoModal = numero;
    document.getElementById('titulo-modal').innerText = `Apostar em ${time} (Nº ${numero})`;
    document.getElementById('modal-aposta').style.display = 'flex';
};

window.fecharModal = function() {
    document.getElementById('modal-aposta').style.display = 'none';
};

window.confirmarApostaModal = function() {
    let qtd = parseInt(document.getElementById('input-qtd-fichas').value);
    if (isNaN(qtd) || qtd <= 0) {
        alert("Digite um valor válido de fichas!");
        return;
    }

    if (qtd > meuSaldo) {
        alert("Você não tem saldo suficiente!");
        return;
    }

    meuSaldo -= qtd;
    document.getElementById('span-saldo').innerText = meuSaldo;

    let chaveAposta = `${timeSelecionadoModal}_${numeroSelecionadoModal}`;
    minhasApostas[chaveAposta] = (minhasApostas[chaveAposta] || 0) + qtd;

    const minhasRef = ref(db, `salas/${minhaSala}/jogadores/${meuIdUnico}`);
    set(minhasRef, {
        nome: meuNome,
        saldo: meuSaldo,
        pronto: false,
        apostas: minhasApostas
    });

    fecharModal();
};

window.finalizarAposta = function() {
    if (Object.keys(minhasApostas).length === 0) {
        alert("Faça pelo menos uma aposta antes de finalizar!");
        return;
    }

    const meuRef = ref(db, `salas/${minhaSala}/jogadores/${meuIdUnico}`);
    set(meuRef, {
        nome: meuNome,
        saldo: meuSaldo,
        pronto: true,
        apostas: minhasApostas
    });

    let btn = document.getElementById('btn-finalizar');
    btn.disabled = true;
    btn.innerText = "Aguardando outros jogadores...";
};

window.novaRodada = function() {
    // Limpa apostas locais e reseta estado no Firebase para todos
    minhasApostas = {};
    
    const salaRef = ref(db, `salas/${minhaSala}`);
    set(ref(db, `salas/${minhaSala}/estadoDados`), null);

    // Reseta o status de pronto de todos os jogadores na sala
    onValue(ref(db, `salas/${minhaSala}/jogadores`), (snapshot) => {
        const jogs = snapshot.val();
        if (jogs) {
            Object.keys(jogs.forEach || jogs).forEach(id => {
                // Mantém o saldo atual de cada um, mas tira o "pronto" e limpa apostas
                let j = jogs[id];
                set(ref(db, `salas/${minhaSala}/jogadores/${id}`), {
                    nome: j.nome,
                    saldo: j.saldo,
                    pronto: false,
                    apostas: {}
                });
            });
        }
    }, { onlyOnce: true });

    let btn = document.getElementById('btn-finalizar');
    btn.disabled = false;
    btn.innerText = "🔒 Finalizar Aposta";
    document.getElementById('btn-nova-rodada').style.display = 'none';
};

function ouvirSalaFirebase() {
    const salaRef = ref(db, `salas/${minhaSala}`);

    onValue(salaRef, (snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;

        const listaUI = document.getElementById('lista-jogadores');
        listaUI.innerHTML = '';
        
        let somaTotalApostasCasas = {};
        let todosProntos = true;
        let totalJogadores = 0;

        if (dados.jogadores) {
            const jogadoresArr = Object.values(dados.jogadores);
            totalJogadores = jogadoresArr.length;

            jogadoresArr.forEach(j => {
                let li = document.createElement('li');
                let statusPronto = j.pronto ? "✅ Pronto" : "⏳ A apostar";
                li.innerHTML = `🧸 <b>${j.nome}</b> - ${j.saldo} 🪙 [${statusPronto}]`;
                listaUI.appendChild(li);

                if (!j.pronto) {
                    todosProntos = false;
                }

                if (j.apostas) {
                    for (let [casa, valor] of Object.entries(j.apostas)) {
                        somaTotalApostasCasas[casa] = (somaTotalApostasCasas[casa] || 0) + valor;
                    }
                }
            });
        }

        // Atualiza os valores visuais nas caixas do tabuleiro
        document.querySelectorAll('.casa-time').forEach(el => {
            el.querySelector('small').innerHTML = `Apostas: 0`;
        });
        for (let [casa, total] of Object.entries(somaTotalApostasCasas)) {
            let [t, n] = casa.split('_');
            let linhaEl = document.getElementById(`linha-${n}`);
            if (linhaEl) {
                let caixas = linhaEl.querySelectorAll('.casa-time');
                caixas.forEach(c => {
                    if (c.classList.contains(`cor-${t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")}`)) {
                        c.querySelector('small').innerHTML = `Apostas: ${total}`;
                    }
                });
            }
        }

        // Se todos estiverem prontos e os dados ainda não foram sorteados
        if (totalJogadores > 0 && todosProntos && !dados.estadoDados) {
            if (meuIdUnico === Object.keys(dados.jogadores)[0]) {
                rodarDadosAutomaticos();
            }
        }

        if (dados.estadoDados) {
            atualizarVisualDados(dados.estadoDados.t1, dados.estadoDados.t2, dados.estadoDados.num);
        } else {
            // Se não há dados sorteados, esconde o botão de nova rodada e limpa o destaque
            document.getElementById('btn-nova-rodada').style.display = 'none';
            document.querySelectorAll('.linha-tabuleiro').forEach(l => l.classList.remove('linha-destacada'));
            document.getElementById('dado-t1').innerText = '?';
            document.getElementById('dado-t2').innerText = '?';
            document.getElementById('dado-num').innerText = '?';
        }
    });
}

function rodarDadosAutomaticos() {
    let t1 = Math.floor(Math.random() * 4) + 1; 
    let t2 = Math.floor(Math.random() * 4) + 1;
    let num = Math.floor(Math.random() * 6) + 1; 

    const estadoRef = ref(db, `salas/${minhaSala}/estadoDados`);
    set(estadoRef, { t1, t2, num });
}

function atualizarVisualDados(t1, t2, num) {
    const nomesTimesMap = { 1: "Corinthians", 2: "Palmeiras", 3: "Flamengo", 4: "Grêmio" };
    const nomeT1 = nomesTimesMap[t1];
    const nomeT2 = nomesTimesMap[t2];

    document.getElementById('dado-t1').innerText = `T${t1}`;
    document.getElementById('dado-t2').innerText = `T${t2}`;
    document.getElementById('dado-num').innerText = num;
    
    document.getElementById('status-jogo').innerText = 
        `Sorteio: ${nomeT1} e ${nomeT2} | Número da Sorte: ${num}`;

    document.querySelectorAll('.linha-tabuleiro').forEach(l => l.classList.remove('linha-destacada'));
    let linhaAtiva = document.getElementById(`linha-${num}`);
    if (linhaAtiva) {
        linhaAtiva.classList.add('linha-destacada');
    }

    // Mostra o botão para iniciar a próxima rodada
    document.getElementById('btn-nova-rodada').style.display = 'block';
}
