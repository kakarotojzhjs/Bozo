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
let ultimoSorteioProcessado = null; 
let temporizadorID = null;

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
    const salaRef = ref(db, `salas/${minhaSala}/estadoDados`);
    onValue(salaRef, (snapshot) => {
        if (snapshot.exists()) {
            alert("Aguarde a nova rodada começar para apostar!");
            return;
        } else {
            timeSelecionadoModal = time;
            numeroSelecionadoModal = numero;
            document.getElementById('titulo-modal').innerText = `Apostar em ${time} (Nº ${numero})`;
            document.getElementById('modal-aposta').style.display = 'flex';
        }
    }, { onlyOnce: true });
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

function limparEIniciarNovaRodada(isAnfitriao) {
    if (temporizadorID) {
        clearInterval(temporizadorID);
        temporizadorID = null;
    }

    minhasApostas = {};
    ultimoSorteioProcessado = null;
    
    if (isAnfitriao) {
        set(ref(db, `salas/${minhaSala}/estadoDados`), null);
    }

    const jogsRef = ref(db, `salas/${minhaSala}/jogadores`);
    onValue(jogsRef, (snapshot) => {
        const jogs = snapshot.val();
        if (jogs) {
            Object.keys(jogs).forEach(id => {
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
    if (btn) {
        btn.disabled = false;
        btn.innerText = "🔒 Finalizar Aposta";
    }

    let statusEl = document.getElementById('status-jogo');
    if (statusEl) {
        statusEl.innerText = "Faça as suas apostas nas casas e clique em Finalizar Aposta!";
    }
}

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
        let listaIdsJogadores = [];

        if (dados.jogadores) {
            const jogadoresObj = dados.jogadores;
            listaIdsJogadores = Object.keys(jogadoresObj);
            totalJogadores = listaIdsJogadores.length;

            listaIdsJogadores.forEach(id => {
                let j = jogadoresObj[id];
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

        document.querySelectorAll('.casa-time').forEach(el => {
            let spanAposta = el.querySelector('.valor-aposta');
            if (spanAposta) spanAposta.innerText = "0";
        });
        
        for (let [casa, total] of Object.entries(somaTotalApostasCasas)) {
            let [t, n] = casa.split('_');
            let linhaEl = document.getElementById(`linha-${n}`);
            if (linhaEl) {
                let caixa = linhaEl.querySelector(`[data-time="${t}"]`);
                if (caixa) {
                    let spanAposta = caixa.querySelector('.valor-aposta');
                    if (spanAposta) spanAposta.innerText = total;
                }
            }
        }

        if (totalJogadores > 0 && todosProntos && !dados.estadoDados) {
            if (meuIdUnico === listaIdsJogadores[0]) {
                rodarDadosAutomaticos();
            }
        }

        if (dados.estadoDados) {
            atualizarVisualDados(dados.estadoDados.t1, dados.estadoDados.t2, dados.estadoDados.num);

            let chaveSorteioID = `${dados.estadoDados.t1}_${dados.estadoDados.t2}_${dados.estadoDados.num}`;
            if (ultimoSorteioProcessado !== chaveSorteioID) {
                ultimoSorteioProcessado = chaveSorteioID;
                calcularPremios(dados.estadoDados.t1, dados.estadoDados.t2, dados.estadoDados.num);

                if (!temporizadorID) {
                    let segundosRestantes = 5;
                    let ehAnfitriao = (meuIdUnico === listaIdsJogadores[0]);

                    temporizadorID = setInterval(() => {
                        let statusEl = document.getElementById('status-jogo');
                        if (statusEl) {
                            statusEl.innerText = `Resultado exibido! Próxima rodada em ${segundosRestantes}s...`;
                        }
                        segundosRestantes--;

                        if (segundosRestantes < 0) {
                            limparEIniciarNovaRodada(ehAnfitriao);
                        }
                    }, 1000);
                }
            }
        } else {
            if (temporizadorID) {
                clearInterval(temporizadorID);
                temporizadorID = null;
            }

            document.querySelectorAll('.casa-time').forEach(c => c.classList.remove('casa-sorteada'));
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

function calcularPremios(t1, t2, numSorteado) {
    const nomesTimesMap = { 1: "Corinthians", 2: "Palmeiras", 3: "Flamengo", 4: "Grêmio" };
    let nomeT1 = nomesTimesMap[t1];
    let nomeT2 = nomesTimesMap[t2];

    let premioTotalRodada = 0;

    for (let [chave, valorApostado] of Object.entries(minhasApostas)) {
        let [timeApostado, numApostado] = chave.split('_');
        numApostado = parseInt(numApostado);

        let acertouTime = (timeApostado === nomeT1 || timeApostado === nomeT2);
        let acertouNumero = (numApostado === numSorteado);

        if (acertouTime && acertouNumero) {
            premioTotalRodada += valorApostado * numSorteado; 
        } else if (acertouTime) {
            premioTotalRodada += valorApostado * 2; 
        }
    }

    if (premioTotalRodada > 0) {
        meuSaldo += premioTotalRodada;
        document.getElementById('span-saldo').innerText = meuSaldo;
    }

    minhasApostas = {};
    const meuRef = ref(db, `salas/${minhaSala}/jogadores/${meuIdUnico}`);
    onValue(meuRef, (snapshot) => {
        let dadosUser = snapshot.val();
        if (dadosUser) {
            set(meuRef, {
                nome: dadosUser.nome,
                saldo: meuSaldo,
                pronto: true,
                apostas: {}
            });
        }
    }, { onlyOnce: true });
}

function atualizarVisualDados(t1, t2, num) {
    const nomesTimesMap = { 1: "Corinthians", 2: "Palmeiras", 3: "Flamengo", 4: "Grêmio" };
    let nomeT1 = nomesTimesMap[t1];
    let nomeT2 = nomesTimesMap[t2];

    document.getElementById('dado-t1').innerText = `T${t1}`;
    document.getElementById('dado-t2').innerText = `T${t2}`;
    document.getElementById('dado-num').innerText = num;

    document.querySelectorAll('.casa-time').forEach(c => c.classList.remove('casa-sorteada'));
    document.querySelectorAll('.linha-tabuleiro').forEach(l => l.classList.remove('linha-destacada'));

    let linhaAtiva = document.getElementById(`linha-${num}`);
    if (linhaAtiva) {
        linhaAtiva.classList.add('linha-destacada');

        // Pinta especificamente a caixa do Time 1 e a caixa do Time 2 na linha ativa usando o atributo data-time
        let caixa1 = linhaAtiva.querySelector(`[data-time="${nomeT1}"]`);
        let caixa2 = linhaAtiva.querySelector(`[data-time="${nomeT2}"]`);

        if (caixa1) caixa1.classList.add('casa-sorteada');
        if (caixa2) caixa2.classList.add('casa-sorteada');
    }
}
