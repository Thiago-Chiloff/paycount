import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../BackButton/backButton";

function FormsCount() {
    const navigate = useNavigate();
    const [permissaoNotificacao, setPermissaoNotificacao] = useState('default');
    const [notificacoesTela, setNotificacoesTela] = useState([]);
    const [serviceWorkerStatus, setServiceWorkerStatus] = useState('carregando');
    const [ultimaVerificacao, setUltimaVerificacao] = useState(null);

    const [forms, setForms] = useState({
        titulo: "",
        descricao: "",
        dataVencimento: "", 
        horaVencimento: "18:00",
        valor: "", 
        pessoa: "",
        banco: "",
        prioridade: "media"
    });

    // Verificar Service Worker e permissões ao carregar
    useEffect(() => {
        verificarServiceWorker();
        verificarPermissoes();
        
        // Verificar contas imediatamente ao carregar
        verificarTodasContas();
        
        // Configurar verificação periódica
        const intervalo = setInterval(() => {
            verificarTodasContas();
        }, 10 * 60 * 1000); // Verificar a cada 10 minutos
        
        // Verificar também quando a página ganha foco
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                verificarTodasContas();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(intervalo);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Verificar se Service Worker está registrado
    const verificarServiceWorker = async () => {
        if (!('serviceWorker' in navigator)) {
            setServiceWorkerStatus('nao_suportado');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            setServiceWorkerStatus('ativo');
            console.log('Service Worker pronto:', registration);
        } catch (error) {
            setServiceWorkerStatus('inativo');
            console.log('Service Worker não disponível:', error);
        }
    };

    const verificarPermissoes = () => {
        setPermissaoNotificacao(Notification.permission);
    };

    // Função para obter data atual sem timezone issues
    const getDataAtual = () => {
        const agora = new Date();
        return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    };

    // Função para converter string de data sem timezone issues
    const parseData = (dataString) => {
        if (!dataString) return null;
        const partes = dataString.split('-');
        return new Date(partes[0], partes[1] - 1, partes[2]);
    };

    // Função para adicionar notificação na tela
    const adicionarNotificacaoTela = (titulo, mensagem, tipo = "info", duracao = 5000) => {
        const id = Date.now();
        const novaNotificacao = {
            id,
            titulo,
            mensagem,
            tipo,
            timestamp: new Date().toLocaleTimeString()
        };

        setNotificacoesTela(prev => [novaNotificacao, ...prev]);

        setTimeout(() => {
            removerNotificacaoTela(id);
        }, duracao);

        return id;
    };

    const removerNotificacaoTela = (id) => {
        setNotificacoesTela(prev => prev.filter(notif => notif.id !== id));
    };

    // Função para enviar notificação PUSH (funciona fora do app)
    const enviarNotificacaoPush = async (titulo, corpo, urgente = false) => {
        // Primeiro, mostrar na tela
        adicionarNotificacaoTela(titulo, corpo, urgente ? "urgent" : "info", 6000);

        // Tentar enviar notificação push se Service Worker estiver ativo
        if (serviceWorkerStatus === 'ativo' && Notification.permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Enviar mensagem para o Service Worker
                registration.active.postMessage({
                    type: 'ENVIAR_NOTIFICACAO',
                    titulo: titulo,
                    corpo: corpo,
                    urgente: urgente
                });

                console.log('📤 Notificação push enviada:', titulo);
                
            } catch (error) {
                console.error('❌ Erro ao enviar notificação push:', error);
                // Fallback: notificação normal
                enviarNotificacaoNormal(titulo, corpo, urgente);
            }
        } else {
            // Fallback para notificação normal
            enviarNotificacaoNormal(titulo, corpo, urgente);
        }
    };

    // Fallback: notificação normal do navegador
    const enviarNotificacaoNormal = (titulo, corpo, urgente = false) => {
        if (Notification.permission === 'granted') {
            try {
                const notificacao = new Notification(titulo, {
                    body: corpo,
                    icon: "/src/assets/a-bag-of-money.png",
                    requireInteraction: urgente,
                    tag: 'paycount-' + Date.now(),
                    silent: false
                });

                notificacao.onclick = () => {
                    window.focus();
                    notificacao.close();
                };
            } catch (error) {
                console.error('Erro na notificação normal:', error);
            }
        }
    };

    // Registrar Service Worker e pedir permissão para notificações PUSH
    const ativarNotificacoesPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            adicionarNotificacaoTela(
                "❌ Navegador Incompatível",
                "Seu navegador não suporta notificações push",
                "error",
                6000
            );
            return false;
        }

        try {
            // Pedir permissão
            const permission = await Notification.requestPermission();
            setPermissaoNotificacao(permission);

            if (permission !== 'granted') {
                adicionarNotificacaoTela(
                    "❌ Permissão Negada",
                    "As notificações push não funcionarão fora do app",
                    "warning",
                    6000
                );
                return false;
            }

            // Registrar Service Worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            setServiceWorkerStatus('ativo');
            
            // Pedir subscription para push (chave pública fictícia para demonstração)
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')
            });

            console.log('✅ Push subscription:', subscription);
            
            adicionarNotificacaoTela(
                "✅ Notificações Push Ativadas!",
                "Agora você receberá lembretes mesmo com o app fechado!",
                "success",
                5000
            );

            // Testar notificação push
            setTimeout(() => {
                enviarNotificacaoPush(
                    "🎉 PayCount - Notificações Push Ativas",
                    "Parabéns! Agora você receberá lembretes automaticamente mesmo com o app fechado.",
                    false
                );
            }, 2000);

            return true;

        } catch (error) {
            console.error('❌ Erro ao ativar notificações push:', error);
            setServiceWorkerStatus('erro');
            
            adicionarNotificacaoTela(
                "❌ Erro na Ativação",
                "Não foi possível ativar notificações push",
                "error",
                6000
            );
            return false;
        }
    };

    // Helper function para push
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Função principal para verificar contas
    const verificarTodasContas = () => {
        const counts = JSON.parse(localStorage.getItem('counts') || '[]');
        const hoje = getDataAtual();
        
        let contasParaNotificar = [];
        let notificacoesEnviadas = 0;

        counts.forEach(count => {
            if (count.pago) return;

            const dataVencimento = parseData(count.dataVencimento);
            if (!dataVencimento) return;

            const diferencaMs = dataVencimento.getTime() - hoje.getTime();
            const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
            
            console.log(`Conta: ${count.titulo}, Vencimento: ${count.dataVencimento}, Dias: ${diferencaDias}`);

            // Verificar se já notificamos hoje
            const jaNotificouHoje = verificarSeJaNotificouHoje(count.id);
            if (jaNotificouHoje) return;

            // Lógica de notificação
            if (diferencaDias < 0) {
                // CONTA VENCIDA
                contasParaNotificar.push({
                    tipo: "vencida",
                    count: count,
                    dias: Math.abs(diferencaDias)
                });
            } else if (diferencaDias === 0) {
                // VENCE HOJE
                contasParaNotificar.push({
                    tipo: "hoje",
                    count: count
                });
            } else if (diferencaDias === 1) {
                // VENCE AMANHÃ
                contasParaNotificar.push({
                    tipo: "amanha", 
                    count: count
                });
            } else if (diferencaDias === 3) {
                // VENCE EM 3 DIAS
                contasParaNotificar.push({
                    tipo: "3dias",
                    count: count
                });
            }
        });

        // Mostrar notificações
        contasParaNotificar.forEach(item => {
            switch (item.tipo) {
                case "vencida":
                    enviarNotificacaoPush(
                        "🚨 CONTA VENCIDA!",
                        `${item.count.titulo} - ${item.count.pessoa}\n💵 Valor: R$ ${item.count.valor.toFixed(2)}\n📅 Vencida há ${item.dias} ${item.dias === 1 ? 'dia' : 'dias'}!`,
                        true
                    );
                    break;
                case "hoje":
                    enviarNotificacaoPush(
                        "⚠️ CONTA VENCE HOJE!",
                        `${item.count.titulo} - ${item.count.pessoa}\n💵 Valor: R$ ${item.count.valor.toFixed(2)}\n⏰ Vence hoje! Não esqueça de pagar!`,
                        true
                    );
                    break;
                case "amanha":
                    enviarNotificacaoPush(
                        "🔔 CONTA VENCE AMANHÃ!",
                        `${item.count.titulo} - ${item.count.pessoa}\n💵 Valor: R$ ${item.count.valor.toFixed(2)}\n📅 Vence amanhã! Prepare o pagamento.`,
                        false
                    );
                    break;
                case "3dias":
                    enviarNotificacaoPush(
                        "📅 CONTA PRÓXIMA",
                        `${item.count.titulo} - ${item.count.pessoa}\n💵 Valor: R$ ${item.count.valor.toFixed(2)}\n📅 Vence em 3 dias!`,
                        false
                    );
                    break;
            }
            
            // Marcar como notificada hoje
            marcarComoNotificadaHoje(item.count.id);
            notificacoesEnviadas++;
        });

        // Atualizar última verificação
        const agora = new Date();
        setUltimaVerificacao(agora.toLocaleTimeString());

        if (notificacoesEnviadas > 0) {
            console.log(`📊 ${notificacoesEnviadas} notificação(ões) enviada(s)`);
        }
    }

    // Sistema para verificar notificações do dia
    const verificarSeJaNotificouHoje = (countId) => {
        const notificacoesHoje = JSON.parse(localStorage.getItem('notificacoesHoje') || '[]');
        const hoje = new Date().toDateString();
        
        return notificacoesHoje.some(notif => 
            notif.data === hoje && 
            notif.countId === countId.toString()
        );
    }

    const marcarComoNotificadaHoje = (countId) => {
        const notificacoesHoje = JSON.parse(localStorage.getItem('notificacoesHoje') || '[]');
        const hoje = new Date().toDateString();
        
        const novaNotificacao = {
            countId: countId.toString(),
            data: hoje,
            timestamp: new Date().toISOString()
        };
        
        const atualizadas = [novaNotificacao, ...notificacoesHoje].slice(0, 50);
        localStorage.setItem('notificacoesHoje', JSON.stringify(atualizadas));
    }

    // Função para forçar verificação manual
    const verificarAgora = () => {
        adicionarNotificacaoTela(
            "🔍 Verificando Contas...",
            "Procurando por contas próximas do vencimento...",
            "info",
            3000
        );
        
        setTimeout(() => {
            verificarTodasContas();
        }, 1000);
    }

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
            adicionarNotificacaoTela("❌ Campo Obrigatório", "Por favor, preencha o título da conta", "warning", 4000);
            return;
        }
        if (!forms.valor || parseFloat(forms.valor) <= 0) {
            adicionarNotificacaoTela("❌ Valor Inválido", "Por favor, insira um valor válido", "warning", 4000);
            return;
        }
        if (!forms.dataVencimento) {
            adicionarNotificacaoTela("❌ Data Obrigatória", "Por favor, selecione uma data de vencimento", "warning", 4000);
            return;
        }
        if (!forms.pessoa) {
            adicionarNotificacaoTela("❌ Pessoa Obrigatória", "Por favor, selecione uma pessoa", "warning", 4000);
            return;
        }
        
        const newCount = {
            ...forms,
            id: Date.now(),
            valor: parseFloat(forms.valor),
            dataCriacao: new Date().toISOString(),
            pago: false
        };

        const existingCounts = JSON.parse(localStorage.getItem('counts') || '[]');
        const updatedCounts = [...existingCounts, newCount];
        localStorage.setItem('counts', JSON.stringify(updatedCounts));

        // Notificar sobre a nova conta
        enviarNotificacaoPush(
            "✅ Conta Adicionada!",
            `${forms.titulo} - ${forms.pessoa}\n💵 Valor: R$ ${forms.valor}\n📅 Vence: ${forms.dataVencimento}\n\n🔔 Você receberá lembretes automáticos!`,
            false
        );

        // Verificar se essa conta já precisa de notificação
        setTimeout(() => {
            verificarTodasContas();
        }, 2000);

        setForms({
            titulo: "", 
            descricao: "", 
            dataVencimento: "", 
            horaVencimento: "18:00",
            valor: "", 
            pessoa: "",
            banco: "", 
            prioridade: "media"
        });
        
        setTimeout(() => navigate('/showcount/showcount'), 3000);
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
        
        {/* Sistema de Notificações na Tela */}
        <div className="notificacoes-tela-container">
            {notificacoesTela.map(notificacao => (
                <div 
                    key={notificacao.id}
                    className={`notificacao-tela ${notificacao.tipo}`}
                    onClick={() => removerNotificacaoTela(notificacao.id)}
                >
                    <div className="notificacao-tela-icon">
                        {notificacao.tipo === "success" && "✅"}
                        {notificacao.tipo === "error" && "❌"}
                        {notificacao.tipo === "warning" && "⚠️"}
                        {notificacao.tipo === "info" && "💡"}
                        {notificacao.tipo === "urgent" && "🚨"}
                    </div>
                    <div className="notificacao-tela-content">
                        <div className="notificacao-tela-titulo">
                            {notificacao.titulo}
                        </div>
                        <div className="notificacao-tela-mensagem">
                            {notificacao.mensagem}
                        </div>
                        <div className="notificacao-tela-tempo">
                            {notificacao.timestamp}
                        </div>
                    </div>
                    <button 
                        className="notificacao-tela-fechar"
                        onClick={(e) => {
                            e.stopPropagation();
                            removerNotificacaoTela(notificacao.id);
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>

        <div className="forms-count-container">
            <h1 className="page-title">Cadastrar Nova Conta</h1>
            
            {/* Seção de Notificações Push */}
            <div className="notificacao-status-section">
                <h3>🔔 Notificações Push</h3>
                
                <div className="status-info">
                    <div className={`status-indicator ${serviceWorkerStatus === 'ativo' ? 'granted' : 'default'}`}>
                        {serviceWorkerStatus === 'ativo' ? "✅ PUSH ATIVO" : 
                         serviceWorkerStatus === 'nao_suportado' ? "❌ NAVEGADOR INCOMPATÍVEL" : 
                         serviceWorkerStatus === 'inativo' ? "🔔 ATIVAR PUSH" : "⏳ VERIFICANDO..."}
                    </div>
                    
                    {ultimaVerificacao && (
                        <div className="ultima-verificacao">
                            📍 Última verificação: {ultimaVerificacao}
                        </div>
                    )}

                    <div className="status-detail">
                        {serviceWorkerStatus === 'ativo' && "✅ Receba notificações mesmo com o app fechado"}
                        {serviceWorkerStatus === 'nao_suportado' && "❌ Seu navegador não suporta notificações push"}
                        {serviceWorkerStatus === 'inativo' && "🔔 Ative as notificações push para receber lembretes automáticos"}
                        {serviceWorkerStatus === 'carregando' && "⏳ Verificando sistema de notificações..."}
                    </div>
                </div>

                <div className="notification-actions">
                    <button 
                        onClick={ativarNotificacoesPush}
                        disabled={serviceWorkerStatus === 'ativo'}
                        className="notification-action-btn primary"
                    >
                        {serviceWorkerStatus === 'ativo' ? "✅ Push Ativo" : "🚀 Ativar Notificações Push"}
                    </button>

                    <button 
                        onClick={verificarAgora}
                        className="notification-action-btn secondary"
                    >
                        🔍 Verificar Agora
                    </button>
                </div>

                <div className="notification-guide">
                    <h4>📋 Como Funcionam os Lembretes:</h4>
                    <div className="notification-steps">
                        <li>
                            <span className="step-number">1</span>
                            <span><strong>Ative as notificações push</strong> clicando no botão acima</span>
                        </li>
                        <li>
                            <span className="step-number">2</span>
                            <span><strong>Permita as notificações</strong> quando o navegador pedir</span>
                        </li>
                        <li>
                            <span className="step-number">3</span>
                            <span><strong>Receba lembretes automáticos</strong> para contas vencidas, que vencem hoje, amanhã e em 3 dias</span>
                        </li>
                        <li>
                            <span className="step-number">4</span>
                            <span><strong>Funciona com app fechado</strong> - você receberá notificações push!</span>
                        </li>
                    </div>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Título: </label>
                <input 
                    type="text" 
                    name="titulo"
                    value={forms.titulo} 
                    onChange={handleInputChange}
                    placeholder="Ex: Conta de Luz, Aluguel, Internet..."
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
                    rows={3}
                    value={forms.descricao}
                    onChange={handleInputChange}
                    placeholder="Detalhes adicionais sobre a conta..."
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
                    placeholder="Onde a conta deve ser paga..."
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
                <h3>Pré-visualização da Conta:</h3>
                <p><strong>📝 Título:</strong> {forms.titulo || "Não informado"}</p>
                <p><strong>👤 Pessoa:</strong> {forms.pessoa || "Não selecionada"}</p>
                <p><strong>📄 Descrição:</strong> {forms.descricao || "Não informada"}</p>
                <p><strong>🏦 Banco:</strong> {forms.banco || "Não informado"}</p>
                <p><strong>💵 Valor:</strong> R$ {forms.valor || "0,00"}</p>
                <p><strong>📅 Data de Vencimento:</strong> {forms.dataVencimento || "Não informada"}</p>
                <p><strong>🎯 Prioridade:</strong> {forms.prioridade === 'media' ? 'Média' : 
                                               forms.prioridade === 'alta' ? 'Alta' : 
                                               forms.prioridade === 'urgente' ? 'Urgente' : 'Baixa'}</p>
            </div>
            
            <button 
                onClick={handleButton}
                disabled={!isFormValid()}
                className={`submit-button ${!isFormValid() ? 'disabled' : ''}`}
            >
                {isFormValid() ? '💾 Salvar Conta e Ativar Lembretes' : 'Preencha os campos obrigatórios'}
            </button>

            <p className="required-info">
                💡 Ative as notificações push para receber lembretes automáticos mesmo com o app fechado!
            </p>
        </div>
        </>
    );
}

export default FormsCount;