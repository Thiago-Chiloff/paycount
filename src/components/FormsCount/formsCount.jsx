import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton/backButton";
import Background from "../Background/background";

function FormsCount() {
    const navigate = useNavigate();

    const [forms, setForms] = useState({
        titulo: "",
        descricao: "",
        dataVencimento: "", 
        horaVencimento: "00:00",
        valor: "", 
        pessoa: "",
        banco: "",
        prioridade: "media"
    });

    // Solicitar permissão para notificações quando o componente carregar
    useEffect(() => {
        solicitarPermissaoNotificacoes().then(permissao => {
            if (permissao) {
                verificarContasExistentes();
            }
        });
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForms(prevState => ({
            ...prevState,
            [name]: value
        }));
    }

    const selecionarPessoa = (nomePessoa) => {
        setForms(prevState => ({
            ...prevState,
            pessoa: nomePessoa
        }));
    }

    const handleButton = async () => {
        if (!forms.titulo.trim()) {
            alert("Por favor, preencha o título da conta.");
            return;
        }

        if (!forms.valor || parseFloat(forms.valor) <= 0) {
            alert("Por favor, insira um valor válido.");
            return;
        }

        if (!forms.dataVencimento) {
            alert("Por favor, selecione uma data de vencimento.");
            return;
        }

        if (!forms.pessoa) {
            alert("Por favor, selecione uma pessoa.");
            return;
        }
        
        // Solicitar permissão para notificações
        const permissaoConcedida = await solicitarPermissaoNotificacoes();
        
        const newCount = {
            ...forms,
            id: Date.now(),
            valor: parseFloat(forms.valor),
            dataCriacao: new Date().toISOString(),
            pago: false
        };

        const existingCounts = JSON.parse(localStorage.getItem('counts')) || [];
        const updatedCounts = [...existingCounts, newCount];
        localStorage.setItem('counts', JSON.stringify(updatedCounts));

        // Agendar notificações para esta conta
        if (permissaoConcedida) {
            agendarNotificacao(newCount);
        }

        iniciarNotificacoes();

        setForms({
            titulo: "",
            descricao: "",
            dataVencimento: "", 
            horaVencimento: "00:00",
            valor: "", 
            pessoa: "",
            banco: "",
            prioridade: "media"
        });
        
        alert(`Conta adicionada com sucesso! ${permissaoConcedida ? 'Notificações ativadas.' : 'Ative as notificações para receber lembretes.'}`);
        navigate('/showcount/showcount');
    }

    const isFormValid = () => {
        return forms.titulo.trim() && 
               forms.valor && 
               parseFloat(forms.valor) > 0 && 
               forms.dataVencimento &&
               forms.pessoa;
    }

    return (
        <>
        <BackButton />
        <div className="forms-count-container">
            <h1 className="page-title">Cadastrar Nova Conta</h1>
            
            {/* Botão de permissão de notificações */}
            <div className="form-group">
                <button 
                    type="button"
                    onClick={solicitarPermissaoNotificacoes}
                    className="notification-permission-btn"
                >
                    {Notification.permission === "granted" 
                        ? "✅ Notificações Ativas" 
                        : "🔔 Ativar Notificações"}
                </button>
                <p className="notification-info">
                    Receba alertas mesmo quando o site estiver fechado
                </p>
            </div>

            <div className="form-group">
                <label className="form-label">Título: </label>
                <input 
                    type="text" 
                    name="titulo"
                    value={forms.titulo} 
                    onChange={handleInputChange}
                    placeholder="Digite o título da conta"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Pessoa: </label>
                <div className="pessoas-buttons">
                    <button 
                        type="button"
                        className={`pessoa-btn ${forms.pessoa === 'Edson' ? 'ativo' : ''}`}
                        onClick={() => selecionarPessoa('Edson')}
                    >
                        Edson
                    </button>
                    <button 
                        type="button"
                        className={`pessoa-btn ${forms.pessoa === 'Arpina' ? 'ativo' : ''}`}
                        onClick={() => selecionarPessoa('Arpina')}
                    >
                        Arpina
                    </button>
                    <button 
                        type="button"
                        className={`pessoa-btn ${forms.pessoa === 'Deborah' ? 'ativo' : ''}`}
                        onClick={() => selecionarPessoa('Deborah')}
                    >
                        Deborah
                    </button>
                </div>
                {forms.pessoa && (
                    <p className="pessoa-selecionada">
                        Pessoa selecionada: <strong>{forms.pessoa}</strong>
                    </p>
                )}
            </div>
            
            <div className="form-group">
                <label className="form-label">Descrição:</label>
                <textarea 
                    name="descricao"
                    rows={4}
                    value={forms.descricao}
                    onChange={handleInputChange}
                    placeholder="Digite uma descrição para a conta"
                    className="form-textarea"
                />
            </div>
            
            <div className="form-group">
                <label className="form-label">Banco:</label>
                <input 
                    type="text" 
                    name="banco"
                    value={forms.banco}
                    onChange={handleInputChange}
                    placeholder="Digite o nome do banco"
                    className="form-input"
                />
            </div>
            
            <div className="form-group">
                <label className="form-label">Valor: </label>
                <input 
                    type="number" 
                    name="valor"
                    value={forms.valor}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="form-input"
                />
            </div>
            
            <div className="form-group">
                <label className="form-label">Data de Vencimento: </label>
                <input 
                    type="date" 
                    name="dataVencimento" 
                    value={forms.dataVencimento}
                    onChange={handleInputChange}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Hora do Lembrete:</label>
                <input 
                    type="time" 
                    name="horaVencimento" 
                    value={forms.horaVencimento}
                    onChange={handleInputChange}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Prioridade:</label>
                <select 
                    name="prioridade"
                    value={forms.prioridade}
                    onChange={handleInputChange}
                    className="form-input"
                >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                </select>
            </div>
            
            <div className="preview-container">
                <h3>Pré-visualização:</h3>
                <p><strong>Título:</strong> {forms.titulo || "Não informado"}</p>
                <p><strong>Pessoa:</strong> {forms.pessoa || "Não selecionada"}</p>
                <p><strong>Descrição:</strong> {forms.descricao || "Não informada"}</p>
                <p><strong>Banco:</strong> {forms.banco || "Não informado"}</p>
                <p><strong>Valor:</strong> R$ {forms.valor || "0,00"}</p>
                <p><strong>Data de Vencimento:</strong> {forms.dataVencimento || "Não informada"}</p>
                <p><strong>Prioridade:</strong> {forms.prioridade === 'media' ? 'Média' : 
                                               forms.prioridade === 'alta' ? 'Alta' : 
                                               forms.prioridade === 'urgente' ? 'Urgente' : 'Baixa'}</p>
            </div>
            
            <button 
                onClick={handleButton}
                disabled={!isFormValid()}
                className={`submit-button ${!isFormValid() ? 'disabled' : ''}`}
            >
                {isFormValid() ? 'Adicionar Conta' : 'Preencha os campos obrigatórios'}
            </button>

            <p className="required-info">
                 Campos obrigatórios
            </p>
        </div>
        </>
    );
}

// Funções de notificação push
const solicitarPermissaoNotificacoes = async () => {
    if (!("Notification" in window)) {
        console.log("Este navegador não suporta notificações.");
        return false;
    }
    
    if (Notification.permission === "granted") {
        return true;
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }
    
    return false;
};

// Função para agendar notificação
const agendarNotificacao = (count) => {
    if (!("Notification" in window)) return;

    const dataVencimento = new Date(count.dataVencimento);
    const agora = new Date();
    const diferencaMs = dataVencimento - agora;

    // Se já passou da data de vencimento, notificar imediatamente
    if (diferencaMs <= 0) {
        enviarNotificacao(count, "VENCIDA");
        return;
    }

    // Notificar no dia do vencimento
    setTimeout(() => {
        enviarNotificacao(count, "HOJE");
    }, diferencaMs);

    // Notificar 1 dia antes
    if (diferencaMs > 24 * 60 * 60 * 1000) {
        setTimeout(() => {
            enviarNotificacao(count, "AMANHÃ");
        }, diferencaMs - (24 * 60 * 60 * 1000));
    }

    // Notificar 3 dias antes
    if (diferencaMs > 3 * 24 * 60 * 60 * 1000) {
        setTimeout(() => {
            enviarNotificacao(count, "EM_3_DIAS");
        }, diferencaMs - (3 * 24 * 60 * 60 * 1000));
    }
};

// Função para enviar a notificação
const enviarNotificacao = (count, tipo) => {
    if (Notification.permission !== "granted") return;

    let titulo, corpo;

    switch (tipo) {
        case "VENCIDA":
            titulo = "🚨 CONTA VENCIDA!";
            corpo = `${count.titulo} - ${count.pessoa}\nValor: R$ ${count.valor.toFixed(2)}`;
            break;
        case "HOJE":
            titulo = "⚠️ CONTA VENCE HOJE!";
            corpo = `${count.titulo} - ${count.pessoa}\nValor: R$ ${count.valor.toFixed(2)}`;
            break;
        case "AMANHÃ":
            titulo = "🔔 CONTA VENCE AMANHÃ!";
            corpo = `${count.titulo} - ${count.pessoa}\nValor: R$ ${count.valor.toFixed(2)}`;
            break;
        case "EM_3_DIAS":
            titulo = "📅 CONTA VENCE EM 3 DIAS";
            corpo = `${count.titulo} - ${count.pessoa}\nValor: R$ ${count.valor.toFixed(2)}`;
            break;
        default:
            return;
    }

    const notificacao = new Notification(titulo, {
        body: corpo,
        icon: "/icon.png", // Altere para o caminho do seu ícone
        tag: `conta-${count.id}-${tipo}`, // Evita duplicatas
        requireInteraction: tipo === "VENCIDA" || tipo === "HOJE",
        silent: tipo !== "VENCIDA"
    });

    // Fechar automaticamente após 10 segundos (exceto para urgentes)
    if (tipo !== "VENCIDA" && tipo !== "HOJE") {
        setTimeout(() => {
            notificacao.close();
        }, 10000);
    }

    notificacao.onclick = () => {
        window.focus();
        notificacao.close();
    };
};

// Verificar e agendar notificações para contas existentes
const verificarContasExistentes = () => {
    const counts = JSON.parse(localStorage.getItem('counts')) || [];
    counts.forEach(count => {
        if (!count.pago) {
            agendarNotificacao(count);
        }
    });
};

function iniciarNotificacoes() {
    if (!localStorage.getItem('notificationTimer')) {
        const timer = setInterval(verificarNotificacoes, 60 * 60 * 1000); 
        
        verificarNotificacoes();
        
        localStorage.setItem('notificationTimer', 'ativo');
    }
}

function verificarNotificacoes() {
    const counts = JSON.parse(localStorage.getItem('counts')) || [];
    const hoje = new Date();
    const notificacoes = [];

    counts.forEach(count => {
        if (count.pago) return;

        const dataVencimento = new Date(count.dataVencimento);
        const diferencaDias = Math.floor((dataVencimento - hoje) / (1000 * 60 * 60 * 24));
        
        let mensagem = '';
        let tipo = 'info';

        if (diferencaDias < 0) {
            mensagem = `🚨 CONTA VENCIDA! "${count.titulo}" para ${count.pessoa} está atrasada há ${Math.abs(diferencaDias)} dias!`;
            tipo = 'urgent';
            // Enviar notificação push para contas vencidas
            if (Notification.permission === "granted") {
                enviarNotificacao(count, "VENCIDA");
            }
        } else if (diferencaDias === 0) {
            mensagem = `⚠️ CONTA VENCE HOJE! "${count.titulo}" para ${count.pessoa} - Valor: R$ ${count.valor.toFixed(2)}`;
            tipo = 'today';
            if (Notification.permission === "granted") {
                enviarNotificacao(count, "HOJE");
            }
        } else if (diferencaDias === 1) {
            mensagem = `🔔 CONTA VENCE AMANHÃ! "${count.titulo}" para ${count.pessoa} - Valor: R$ ${count.valor.toFixed(2)}`;
            tipo = 'tomorrow';
            if (Notification.permission === "granted") {
                enviarNotificacao(count, "AMANHÃ");
            }
        } else if (diferencaDias <= 3) {
            mensagem = `📅 "${count.titulo}" para ${count.pessoa} vence em ${diferencaDias} dias - R$ ${count.valor.toFixed(2)}`;
            tipo = 'soon';
            if (diferencaDias === 3 && Notification.permission === "granted") {
                enviarNotificacao(count, "EM_3_DIAS");
            }
        } else if (diferencaDias <= 7) {
            mensagem = `📋 "${count.titulo}" para ${count.pessoa} vence em ${diferencaDias} dias`;
            tipo = 'week';
        }

        if (mensagem) {
            notificacoes.push({
                mensagem,
                tipo,
                prioridade: count.prioridade,
                diasRestantes: diferencaDias,
                dataVencimento: count.dataVencimento,
                pessoa: count.pessoa
            });
        }
    });

    notificacoes.sort((a, b) => {
        if (a.diasRestantes !== b.diasRestantes) {
            return a.diasRestantes - b.diasRestantes;
        }

        const prioridades = { 'urgente': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
        return prioridades[b.prioridade] - prioridades[a.prioridade];
    });

    localStorage.setItem('ultimasNotificacoes', JSON.stringify({
        data: new Date().toISOString(),
        notificacoes: notificacoes
    }));

    exibirNotificacoes(notificacoes);
}

function exibirNotificacoes(notificacoes) {
    const notificacaoExistente = document.getElementById('sistema-notificacoes');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }

    if (notificacoes.length === 0) return;

    const notificacaoContainer = document.createElement('div');
    notificacaoContainer.id = 'sistema-notificacoes';
    notificacaoContainer.innerHTML = `
        <div class="notificacao-header">
            <h3>🔔 Lembretes de Contas</h3>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="notificacao-list">
            ${notificacoes.map(notif => `
                <div class="notificacao-item ${notif.tipo}">
                    <span class="notificacao-icon">
                        ${notif.tipo === 'urgent' ? '🚨' : 
                          notif.tipo === 'today' ? '⚠️' : 
                          notif.tipo === 'tomorrow' ? '🔔' : 
                          notif.tipo === 'soon' ? '📅' : '📋'}
                    </span>
                    <div class="notificacao-content">
                        <span class="notificacao-mensagem">${notif.mensagem}</span>
                        <span class="notificacao-prioridade ${notif.prioridade}">${notif.prioridade}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(notificacaoContainer);

    if (!notificacoes.some(notif => notif.tipo === 'urgent' || notif.tipo === 'today')) {
        setTimeout(() => {
            const notif = document.getElementById('sistema-notificacoes');
            if (notif) notif.remove();
        }, 30000);
    }
}

if (typeof window !== 'undefined') {
    window.verificarNotificacoes = verificarNotificacoes;
    window.exibirNotificacoes = exibirNotificacoes;
    window.iniciarNotificacoes = iniciarNotificacoes;
}

export default FormsCount;