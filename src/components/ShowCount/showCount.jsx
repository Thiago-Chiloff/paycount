import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BackButton from "../BackButton/backButton";

function ShowCount() {
    const location = useLocation();
    const [counts, setCounts] = useState([]);
    const [expandedCount, setExpandedCount] = useState(null);
    const [filtro, setFiltro] = useState('todas'); 
    useEffect(() => {
        const carregarContas = () => {
            const contasSalvas = JSON.parse(localStorage.getItem('counts')) || [];
            setCounts(contasSalvas);
        };

        carregarContas();
        
        const handleStorageChange = () => {
            carregarContas();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const toggleDescription = (countId) => {
        if (expandedCount === countId) {
            setExpandedCount(null);
        } else {
            setExpandedCount(countId);
        }
    };

    const deleteCount = (countId) => {
        if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
            const updatedCounts = counts.filter(count => count.id !== countId);
            localStorage.setItem('counts', JSON.stringify(updatedCounts));
            setCounts(updatedCounts);
        }
    };

    const togglePago = (countId) => {
        const updatedCounts = counts.map(count => {
            if (count.id === countId) {
                return { ...count, pago: !count.pago };
            }
            return count;
        });
        localStorage.setItem('counts', JSON.stringify(updatedCounts));
        setCounts(updatedCounts);
    };

    const getStatusConta = (dataVencimento, pago) => {
        if (pago) return { status: 'pago', classe: 'pago' };
        
        const hoje = new Date();
        const vencimento = new Date(dataVencimento);
        const diferencaDias = Math.floor((vencimento - hoje) / (1000 * 60 * 60 * 24));
        
        if (diferencaDias < 0) return { status: 'vencido', classe: 'vencido' };
        if (diferencaDias === 0) return { status: 'hoje', classe: 'hoje' };
        if (diferencaDias <= 3) return { status: 'proximo', classe: 'proximo' };
        return { status: 'pendente', classe: 'pendente' };
    };

    const filtrarContas = () => {
        switch (filtro) {
            case 'pendentes':
                return counts.filter(count => !count.pago);
            case 'pagas':
                return counts.filter(count => count.pago);
            default:
                return counts;
        }
    };

    const contasFiltradas = filtrarContas();

    const contasOrdenadas = [...contasFiltradas].sort((a, b) => {
        return new Date(a.dataVencimento) - new Date(b.dataVencimento);
    });

    return (
        <div className="show-count-container">
            <BackButton />
            <h1 className="page-title">Lista de Contas</h1>

            {/* Filtros */}
            <div className="filtros-container">
                <button 
                    className={`filtro-btn ${filtro === 'todas' ? 'ativo' : ''}`}
                    onClick={() => setFiltro('todas')}
                >
                    Todas ({counts.length})
                </button>
                <button 
                    className={`filtro-btn ${filtro === 'pendentes' ? 'ativo' : ''}`}
                    onClick={() => setFiltro('pendentes')}
                >
                    Pendentes ({counts.filter(c => !c.pago).length})
                </button>
                <button 
                    className={`filtro-btn ${filtro === 'pagas' ? 'ativo' : ''}`}
                    onClick={() => setFiltro('pagas')}
                >
                    Pagas ({counts.filter(c => c.pago).length})
                </button>
            </div>

            {contasOrdenadas.length > 0 ? (
                <div className="counts-list">
                    {contasOrdenadas.map((count) => {
                        const status = getStatusConta(count.dataVencimento, count.pago);
                        return (
                            <div key={count.id} className={`count-item ${status.classe}`}>
                                <div className="count-header">
                                    <div className="count-info">
                                        <h3>{count.titulo}</h3>
                                        <span className={`status-badge ${status.classe}`}>
                                            {status.status === 'pago' ? '✅ Pago' :
                                             status.status === 'vencido' ? '🚨 Vencido' :
                                             status.status === 'hoje' ? '⚠️ Vence hoje' :
                                             status.status === 'proximo' ? '🔔 Próximo' : '📅 Pendente'}
                                        </span>
                                    </div>
                                    <div className="count-actions">
                                        <button 
                                            onClick={() => togglePago(count.id)}
                                            className={`status-button ${count.pago ? 'pago' : 'pendente'}`}
                                        >
                                            {count.pago ? 'Marcar como Pendente' : 'Marcar como Pago'}
                                        </button>
                                        <button 
                                            onClick={() => toggleDescription(count.id)}
                                            className="toggle-button"
                                        >
                                            {expandedCount === count.id ? 'Ocultar' : 'Ver Detalhes'}
                                        </button>
                                        <button 
                                            onClick={() => deleteCount(count.id)}
                                            className="delete-button"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="count-resumo">
                                    <p><strong>Para:</strong> {count.pessoa}</p>
                                    <p><strong>Valor:</strong> R$ {count.valor.toFixed(2)}</p>
                                    <p><strong>Vencimento:</strong> {new Date(count.dataVencimento).toLocaleDateString('pt-BR')}</p>
                                    <p><strong>Prioridade:</strong> 
                                        <span className={`prioridade-badge ${count.prioridade}`}>
                                            {count.prioridade === 'media' ? 'Média' : 
                                             count.prioridade === 'alta' ? 'Alta' : 
                                             count.prioridade === 'urgente' ? 'Urgente' : 'Baixa'}
                                        </span>
                                    </p>
                                </div>
                                
                                {expandedCount === count.id && (
                                    <div className="count-details">
                                        <p><strong>Descrição:</strong> {count.descricao || "Não informada"}</p>
                                        <p><strong>Banco:</strong> {count.banco || "Não informado"}</p>
                                        <p><strong>Data de Criação:</strong> {new Date(count.dataCriacao).toLocaleDateString('pt-BR')}</p>
                                        <p><strong>Hora do Lembrete:</strong> {count.horaVencimento || "18:00"}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="no-data">
                    {filtro === 'todas' 
                        ? "Nenhuma conta cadastrada. Adicione uma conta primeiro." 
                        : `Nenhuma conta ${filtro} encontrada.`}
                </p>
            )}
            
            {counts.length > 0 && (
                <div className="resumo-container">
                    <h3>Resumo Financeiro</h3>
                    <div className="resumo-grid">
                        <div className="resumo-item">
                            <span className="resumo-label">Total de Contas:</span>
                            <span className="resumo-valor">{counts.length}</span>
                        </div>
                        <div className="resumo-item">
                            <span className="resumo-label">Contas Pagas:</span>
                            <span className="resumo-valor verde">{counts.filter(c => c.pago).length}</span>
                        </div>
                        <div className="resumo-item">
                            <span className="resumo-label">Contas Pendentes:</span>
                            <span className="resumo-valor laranja">{counts.filter(c => !c.pago).length}</span>
                        </div>
                        <div className="resumo-item">
                            <span className="resumo-label">Valor Total Pendente:</span>
                            <span className="resumo-valor vermelho">
                                R$ {counts.filter(c => !c.pago).reduce((total, count) => total + count.valor, 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShowCount;