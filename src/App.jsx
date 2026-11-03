import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Edit3, 
  Search, 
  Download, 
  Upload, 
  RefreshCw, 
  Calendar, 
  User, 
  FileText, 
  Database, 
  Send, 
  Check, 
  Save, 
  Filter, 
  History, 
  Globe, 
  Lock, 
  Code, 
  Copy, 
  Trash2, 
  Eye, 
  Activity,
  Sliders
} from 'lucide-react';

// Dados Iniciais da Operação Nemak (35 Equipamentos)
const INITIAL_EQUIPMENT_DATA = [
  { id: "4516", currentHours: 475.9 },
  { id: "4519", currentHours: 768.2 },
  { id: "4522", currentHours: 640.2 },
  { id: "4525", currentHours: 692.6 },
  { id: "4528", currentHours: 232.8 },
  { id: "4531", currentHours: 604.0 },
  { id: "4534", currentHours: 467.2 },
  { id: "4537", currentHours: 667.4 },
  { id: "4540", currentHours: 609.2 },
  { id: "4543", currentHours: 468.7 },
  { id: "4546", currentHours: 64.4 },
  { id: "4549", currentHours: 80.3 },
  { id: "4558", currentHours: 607.2 },
  { id: "4561", currentHours: 683.4 },
  { id: "4564", currentHours: 158.5 },
  { id: "4567", currentHours: 712.4 },
  { id: "4570", currentHours: 758.7 },
  { id: "4573", currentHours: 448.5 },
  { id: "4576", currentHours: 191.6 },
  { id: "4579", currentHours: 466.4 },
  { id: "4582", currentHours: 741.2 },
  { id: "4585", currentHours: 502.2 },
  { id: "4588", currentHours: 573.4 },
  { id: "4591", currentHours: 877.7 },
  { id: "4594", currentHours: 675.9 },
  { id: "4600", currentHours: 604.6 },
  { id: "4603", currentHours: 339.9 },
  { id: "4606", currentHours: 443.0 },
  { id: "4609", currentHours: 764.1 },
  { id: "4612", currentHours: 766.2 },
  { id: "4615", currentHours: 814.4 },
  { id: "4618", currentHours: 724.7 },
  { id: "4624", currentHours: 41.7 },
  { id: "4632", currentHours: 547.6 },
  { id: "4635", currentHours: 761.7 }
];

// Gerador dinâmico de Planos de Preventiva (250h até 50.000h)
const PREVENTIVE_PLANS = Array.from({ length: 200 }, (_, i) => (i + 1) * 250);

// Função para calcular o próximo alvo em sequência fixa de 250h
const calculateNextFixedPreventive = (currentHours) => {
  const hours = parseFloat(currentHours) || 0;
  return (Math.floor(hours / 250) + 1) * 250;
};

export default function App() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  // Estados de Interface
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | history | api | backup
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | OK | ALERT | OVERDUE
  const [historyLogType, setHistoryLogType] = useState('ALL'); // ALL | PREVENTIVE | HOUR_UPDATE
  const [eqHistoryTab, setEqHistoryTab] = useState('PREVENTIVE'); // PREVENTIVE | HOUR_UPDATE
  const [toastMessage, setToastMessage] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  // --- DECLARAÇÃO DE ESTADOS DOS MODAIS E FORMULÁRIOS ---
  const [selectedEqForHourUpdate, setSelectedEqForHourUpdate] = useState(null);
  const [newHourInput, setNewHourInput] = useState('');

  const [selectedEqForMaintenance, setSelectedEqForMaintenance] = useState(null);
  const [maintHoursInput, setMaintHoursInput] = useState('');
  const [maintDateInput, setMaintDateInput] = useState('');
  const [maintPlanInput, setMaintPlanInput] = useState('250h');
  const [maintTechnician, setMaintTechnician] = useState('');
  const [maintNotes, setMaintNotes] = useState('');

  const [selectedEqForHistory, setSelectedEqForHistory] = useState(null);

  const [editingLogDate, setEditingLogDate] = useState(null);
  const [newLogDateValue, setNewLogDateValue] = useState('');

  // Toast Helper Protegido (Garante apenas strings na árvore React)
  const showToast = (msg, type = 'success') => {
    const text = typeof msg === 'string' ? msg : typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
    setToastMessage({ msg: text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/state');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setEquipmentList(data.equipmentList);
      setLogs(data.logs);
      setRevision(data.revision);
    } catch {
      setLoadError('Não foi possível carregar os dados. Tente novamente.');
    } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const saveAllData = async (newList, newLogs) => {
    setSaving(true);
    try {
      const response = await fetch('/api/state', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentList: newList, logs: newLogs, revision })
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Não foi possível salvar.');
      }
      const result = await response.json();
      setRevision(result.revision);
      setLastSavedTime(new Date().toLocaleTimeString('pt-BR'));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
      return true;
    } catch (error) {
      await loadData();
      showToast(error.message || 'Falha ao salvar os dados.', 'error');
      return false;
    } finally { setSaving(false); }
  };

  // Atualizador centralizado de Horímetro
  const updateEquipmentHour = async (eqId, newHours, source = 'Manual') => {
    const updatedList = equipmentList.map(eq => {
      if (eq.id === eqId) {
        const val = Math.max(eq.currentHours, newHours);
        return { ...eq, currentHours: val };
      }
      return eq;
    });

    const logEntry = {
      id: Date.now() + Math.random(),
      equipmentId: eqId,
      type: 'HOUR_UPDATE',
      value: newHours,
      date: new Date().toLocaleString('pt-BR'),
      source
    };

    const updatedLogs = [logEntry, ...logs];

    setEquipmentList(updatedList);
    setLogs(updatedLogs);
    if (!await saveAllData(updatedList, updatedLogs)) return false;
    recordApiLog('RECEIVE', `Horímetro Equip. ${eqId} atualizado para ${newHours}h (${source})`);
    return true;
  };

  const recordApiLog = (direction, details) => {
    setApiLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString('pt-BR'), direction, details },
      ...prev.slice(0, 49)
    ]);
  };

  // Helper de Status do Equipamento
  const getEquipmentStatus = (eq) => {
    const remaining = eq.nextPreventive - eq.currentHours;
    if (remaining <= 0) {
      return { 
        code: 'OVERDUE', 
        label: 'VENCIDA', 
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        badgeBg: 'bg-rose-500',
        remaining 
      };
    }
    if (remaining <= 50) {
      return { 
        code: 'ALERT', 
        label: 'ATENÇÃO (≤ 50h)', 
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badgeBg: 'bg-amber-500',
        remaining 
      };
    }
    return { 
      code: 'OK', 
      label: 'EM DIA', 
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      badgeBg: 'bg-emerald-500',
      remaining 
    };
  };

  // Estatísticas do Dashboard
  const stats = useMemo(() => {
    let ok = 0;
    let alert = 0;
    let overdue = 0;

    equipmentList.forEach(eq => {
      const st = getEquipmentStatus(eq);
      if (st.code === 'OK') ok++;
      else if (st.code === 'ALERT') alert++;
      else if (st.code === 'OVERDUE') overdue++;
    });

    return { total: equipmentList.length, ok, alert, overdue };
  }, [equipmentList]);

  // Lista Filtrada do Histórico por Tipo (Preventivas x Horímetros)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (historyLogType === 'PREVENTIVE') return log.type === 'PREVENTIVE_DONE';
      if (historyLogType === 'HOUR_UPDATE') return log.type === 'HOUR_UPDATE';
      return true;
    });
  }, [logs, historyLogType]);

  // Lista Filtrada dos Equipamentos
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(eq => {
      const matchesSearch = eq.id.toLowerCase().includes(searchTerm.toLowerCase());
      const st = getEquipmentStatus(eq);
      const matchesStatus = statusFilter === 'ALL' || st.code === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [equipmentList, searchTerm, statusFilter]);

  // --- HANDLERS ---
  const handleOpenHourModal = (eq) => {
    setSelectedEqForHourUpdate(eq);
    setNewHourInput(String(eq.currentHours));
  };

  const handleSaveSingleHour = async (e) => {
    e.preventDefault();
    if (!selectedEqForHourUpdate) return;
    const val = parseFloat(newHourInput);
    if (!Number.isFinite(val) || val < 0) {
      showToast('Por favor, informe um horímetro válido.', 'error');
      return;
    }
    if (val < selectedEqForHourUpdate.currentHours) {
      showToast('O horímetro não pode ser menor que o atual.', 'error');
      return;
    }

    if (!await updateEquipmentHour(selectedEqForHourUpdate.id, val, 'Atualização Manual')) return;
    showToast(`Horímetro do equipamento ${selectedEqForHourUpdate.id} atualizado para ${val}h!`);
    setSelectedEqForHourUpdate(null);
  };

  const handleOpenMaintenanceModal = (eq) => {
    setSelectedEqForMaintenance(eq);
    setMaintHoursInput(String(eq.currentHours));
    
    // Sugere a data e hora atual
    const now = new Date();
    const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setMaintDateInput(isoString);

    // Sugere a próxima meta aproximada
    const suggestedMeta = eq.nextPreventive;
    const planValue = suggestedMeta;
    setMaintPlanInput(`${planValue}h`);
    
    setMaintTechnician('');
    setMaintNotes('');
  };

  const handleRegisterMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedEqForMaintenance) return;
    const execHours = parseFloat(maintHoursInput);
    if (!Number.isFinite(execHours) || execHours < 0) {
      showToast('Informe o horímetro correto da realização.', 'error');
      return;
    }

    const planNum = parseInt(maintPlanInput.replace('h', '')) || 250;
    // REGRA DE SEQUÊNCIA FIXA: O próximo alvo é o plano realizado + 250h
    const nextMeta = planNum + 250;
    
    let formattedDate = new Date().toLocaleString('pt-BR');
    if (maintDateInput) {
      const parsedDate = new Date(maintDateInput);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleString('pt-BR');
      }
    }

    const newLog = {
      id: Date.now(),
      equipmentId: selectedEqForMaintenance.id,
      type: 'PREVENTIVE_DONE',
      executedAtHours: execHours,
      plan: `${planNum}h`,
      nextMetaTarget: nextMeta,
      date: formattedDate,
      isoDate: maintDateInput || new Date().toISOString(),
      technician: maintTechnician || 'Técnico Responsável',
      notes: maintNotes || 'Preventiva realizada no prazo conforme checklist.'
    };

    // Atualiza a lista de equipamentos E anexa a nova preventiva diretamente ao histórico próprio da máquina
    const updatedEquipment = equipmentList.map(eq => {
      if (eq.id === selectedEqForMaintenance.id) {
        const existingHist = Array.isArray(eq.preventiveHistory) ? eq.preventiveHistory : [];
        return {
          ...eq,
          currentHours: Math.max(eq.currentHours, execHours),
          lastPreventiveHours: execHours,
          nextPreventive: nextMeta,
          lastPreventiveDate: formattedDate,
          preventiveHistory: [newLog, ...existingHist]
        };
      }
      return eq;
    });

    const updatedLogs = [newLog, ...logs];

    setEquipmentList(updatedEquipment);
    setLogs(updatedLogs);
    if (!await saveAllData(updatedEquipment, updatedLogs)) return;
    recordApiLog('SEND', `Preventiva ${planNum}h concluída no Equip. ${selectedEqForMaintenance.id} (${execHours}h)`);
    showToast(`Preventiva de ${planNum}h do Equip. ${selectedEqForMaintenance.id} salva no banco de dados.`);
    setSelectedEqForMaintenance(null);
  };

  const handleUpdateLogDate = async (e) => {
    e.preventDefault();
    if (!editingLogDate || !newLogDateValue) return;

    const formattedDate = new Date(newLogDateValue).toLocaleString('pt-BR');

    const updatedLogs = logs.map(item => {
      if (item.id === editingLogDate.id) {
        return {
          ...item,
          date: formattedDate,
          isoDate: newLogDateValue
        };
      }
      return item;
    });

    const updatedEquipment = equipmentList.map(eq => {
      if (eq.id === editingLogDate.equipmentId) {
        const updatedHist = (eq.preventiveHistory || []).map(h => {
          if (h.id === editingLogDate.id) {
            return { ...h, date: formattedDate, isoDate: newLogDateValue };
          }
          return h;
        });
        const latestPreventive = logs.find(log => log.equipmentId === eq.id && log.type === 'PREVENTIVE_DONE');
        return { 
          ...eq, 
          lastPreventiveDate: latestPreventive?.id === editingLogDate.id ? formattedDate : eq.lastPreventiveDate,
          preventiveHistory: updatedHist
        };
      }
      return eq;
    });

    setLogs(updatedLogs);
    setEquipmentList(updatedEquipment);
    if (!await saveAllData(updatedEquipment, updatedLogs)) return;

    showToast('Data da preventiva atualizada e salva!');
    setEditingLogDate(null);
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ equipmentList, logs }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nemak_preventivas_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed.equipmentList) || !Array.isArray(parsed.logs)) throw new Error();
        if (!await saveAllData(parsed.equipmentList, parsed.logs)) return;
        setEquipmentList(parsed.equipmentList);
        setLogs(parsed.logs);
        showToast('Backup restaurado com sucesso!');
      } catch (err) {
        showToast('Erro ao importar arquivo de backup.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Função para Carga e Atualização em Lote de Horímetros via JSON
  const handleImportHoursJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        let itemsToUpdate = [];

        // Identifica a estrutura do arquivo automaticamente
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && Array.isArray(parsed[0])) {
            // Array de Arrays: [["4516", 500], ["4519", 780]]
            itemsToUpdate = parsed.map(arr => ({ equipmentId: String(arr[0]), currentHours: arr[1] }));
          } else {
            // Array de Objetos: [{"equipmentId": "4516", "currentHours": 476.0, "readingStatus": "available"}]
            itemsToUpdate = parsed;
          }
        } else if (parsed && typeof parsed === 'object') {
          // Checa se os itens estão dentro de uma propriedade raiz (ex: equipmentList, readings, data, items)
          const possibleArrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));

          if (possibleArrayKey) {
            itemsToUpdate = parsed[possibleArrayKey];
          } else {
            // Chave-Valor puro: { "4516": 476.0, "4519": 768.2 }
            itemsToUpdate = Object.keys(parsed).map(key => ({
              equipmentId: key,
              currentHours: parsed[key]
            }));
          }
        }

        if (!Array.isArray(itemsToUpdate) || itemsToUpdate.length === 0) {
          showToast('Nenhum dado de horímetro válido encontrado no arquivo JSON.', 'error');
          return;
        }

        let updatedCount = 0;
        let processedCount = 0;
        const newLogs = [];

        const updatedList = equipmentList.map(eq => {
          // Mapeamento flexível de chaves (equipmentId, equipment_id, id, equipamento, etc.)
          const found = itemsToUpdate.find(item => {
            if (!item || typeof item !== 'object') return false;

            const eqIdVal = item.equipmentId ?? item.equipment_id ?? item.equipment ?? item.id ?? item.equipamento ?? item.codigo ?? item.tag ?? item.frota;

            if (eqIdVal !== undefined && eqIdVal !== null) {
              return String(eqIdVal).trim() === String(eq.id).trim();
            }

            // Fallback por varredura com expressão regular
            const keys = Object.keys(item);
            const idKey = keys.find(k => k.toLowerCase().match(/equipmentid|equipment|equip|id|c[óo]digo|tag|frota|m[aá]quina/));
            return idKey && String(item[idKey]).trim() === String(eq.id).trim();
          });

          if (found) {
            // Mapeamento flexível de horímetro (currentHours, current_hours, hours, horimetro, lectura, etc.)
            let rawVal = found.currentHours ?? found.current_hours ?? found.hours ?? found.horimetro ?? found.leitura ?? found.value ?? found.reading;
            if (rawVal === undefined) {
              const keys = Object.keys(found);
              const valKey = keys.find(k => k.toLowerCase().match(/hour|hora|hor[ií]metro|valor|leitura|current|reading/));
              if (valKey) rawVal = found[valKey];
            }

            const newHours = parseFloat(rawVal);

            // Se for um número válido, atualiza o equipamento correspondente
            if (Number.isFinite(newHours) && newHours >= eq.currentHours) {
              processedCount++;
              if (newHours !== eq.currentHours) {
                updatedCount++;
              }
              newLogs.push({
                id: Date.now() + Math.random(),
                equipmentId: eq.id,
                type: 'HOUR_UPDATE',
                value: newHours,
                date: new Date().toLocaleString('pt-BR'),
                source: 'Carga Lote JSON'
              });
              return { ...eq, currentHours: newHours };
            }
          }
          return eq;
        });

        if (processedCount > 0) {
          const finalLogs = [...newLogs, ...logs];
          setEquipmentList(updatedList);
          setLogs(finalLogs);
          if (!await saveAllData(updatedList, finalLogs)) return;
          showToast(`Carga concluída! ${processedCount} equipamento(s) atualizados de acordo com o arquivo.`, 'success');
        } else {
          showToast('Nenhum equipamento do arquivo JSON atendeu aos 35 equipamentos cadastrados.', 'error');
        }
      } catch (err) {
        console.error('Erro ao ler JSON:', err);
        showToast('Erro ao processar o arquivo JSON. Verifique a sintaxe.', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetToFactory = async () => {
    if (window.confirm('Tem certeza que deseja restaurar as leituras iniciais dos 35 equipamentos?')) {
      const reseted = INITIAL_EQUIPMENT_DATA.map(eq => {
        const nextMeta = calculateNextFixedPreventive(eq.currentHours);
        return {
          ...eq,
          lastPreventiveHours: Math.max(0, nextMeta - 250),
          nextPreventive: nextMeta,
          lastPreventiveDate: 'Carga Inicial'
        };
      });
      setEquipmentList(reseted);
      setLogs([]);
      if (!await saveAllData(reseted, [])) return;
      showToast('Dados restaurados para os 35 equipamentos originais!');
    }
  };

  return (
    <div className="nemak-app min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* NOTIFICAÇÃO TOAST */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md transition-all animate-pulse ${
          toastMessage.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
          toastMessage.type === 'info' ? 'bg-sky-950/90 border-sky-500/50 text-sky-200' :
          'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <XCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-medium">{toastMessage.msg}</span>
        </div>
      )}

      {saving && <div className="fixed inset-0 z-[60] bg-slate-950/60 flex items-center justify-center" role="status"><span className="bg-slate-900 border border-slate-700 p-6 rounded-xl">Salvando alteração…</span></div>}
      {/* CABEÇALHO */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Operação Nemak
                <span className={`text-xs font-semibold border px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition-all duration-300 ${
                  justSaved 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 scale-105 shadow-md shadow-emerald-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <Save className={`w-3.5 h-3.5 text-emerald-400 ${justSaved ? 'animate-pulse' : ''}`} />
                  {saving ? 'Salvando…' : lastSavedTime ? `Salvo às ${lastSavedTime}` : 'Dados compartilhados'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Ciclo Fixo de 250h (250h, 500h, 750h...) • Alerta em ≤ 50h • Frota de 35 Equipamentos
              </p>
            </div>
          </div>

          {/* MENUS DE NAVEGAÇÃO */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'dashboard' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              Painel Geral
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'history' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'api' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              Sincronização
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'backup' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              Dados / Backup
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading || loadError ? (
          <section className="py-20 text-center space-y-4" role="status">
            <Activity className="w-9 h-9 text-sky-400 mx-auto animate-pulse" />
            <p>{loadError || 'Carregando dados da operação…'}</p>
            {loadError && <button onClick={loadData} className="bg-sky-500 rounded-lg px-4 py-2">Tentar novamente</button>}
          </section>
        ) : <>
        {/* ABA: PAINEL GERAL */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* CARDS KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Frota</span>
                  <div className="p-2 bg-slate-800 text-slate-300 rounded-lg"><Sliders className="w-4 h-4" /></div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats.total}</span>
                  <span className="text-xs text-slate-400">equipamentos</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Em Dia</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">{stats.ok}</span>
                  <span className="text-xs text-slate-400">&gt; 50h de folga</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Atenção (≤ 50h)</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400">{stats.alert}</span>
                  <span className="text-xs text-slate-400">próximos da revisão</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Preventiva Vencida</span>
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><XCircle className="w-4 h-4" /></div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-rose-400">{stats.overdue}</span>
                  <span className="text-xs text-slate-400">necessita parada</span>
                </div>
              </div>
            </div>

            {/* CONTROLES DE BUSCA E FILTROS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Buscar equipamento (ex: 4516)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>

                <label className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  Carga Lote JSON
                  <input type="file" accept=".json" onChange={handleImportHoursJson} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold pr-2"><Filter className="w-3.5 h-3.5" /> Filtrar:</span>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos ({equipmentList.length})
                </button>
                <button
                  onClick={() => setStatusFilter('OK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'OK' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
                  }`}
                >
                  Em Dia ({stats.ok})
                </button>
                <button
                  onClick={() => setStatusFilter('ALERT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'ALERT' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
                  }`}
                >
                  Atenção (≤ 50h) ({stats.alert})
                </button>
                <button
                  onClick={() => setStatusFilter('OVERDUE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === 'OVERDUE' ? 'bg-rose-500 text-white' : 'bg-slate-950 text-rose-400 hover:bg-rose-500/10 border border-slate-800'
                  }`}
                >
                  Vencidas ({stats.overdue})
                </button>
              </div>
            </div>

            {/* GRID DOS EQUIPAMENTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((eq) => {
                const st = getEquipmentStatus(eq);
                const cycleStart = Math.max(0, eq.nextPreventive - 250);
                const progressPercent = Math.min(100, Math.max(0, ((eq.currentHours - cycleStart) / 250) * 100));
                const eqLogsCount = logs.filter(l => l.equipmentId === eq.id && l.type === 'PREVENTIVE_DONE').length;

                return (
                  <div key={eq.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all">
                    <div>
                      {/* TOPO CARD */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-white tracking-tight">Equipamento #{eq.id}</span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${st.color}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* DETALHES DE HORÍMETRO */}
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Horímetro Atual:</span>
                          <span className="text-lg font-extrabold text-white">{eq.currentHours.toFixed(1)} h</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Próxima Preventiva (Alvo):</span>
                          <span className="text-sm font-bold text-sky-400">{eq.nextPreventive} h</span>
                        </div>

                        {/* BARRA DE PROGRESSO DO CICLO FIXO */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400">Ciclo 250h ({cycleStart}h → {eq.nextPreventive}h)</span>
                            <span className={`font-bold ${st.remaining <= 0 ? 'text-rose-400' : st.remaining <= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {st.remaining <= 0 ? `Vencida por ${Math.abs(st.remaining).toFixed(1)}h` : `Faltam ${st.remaining.toFixed(1)}h`}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                st.remaining <= 0 ? 'bg-rose-500' : st.remaining <= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* ÚLTIMA MANUTENÇÃO */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            Última Realizada:
                          </span>
                          <span className="font-medium text-slate-300">{eq.lastPreventiveDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* AÇÕES NO FOOTER DO CARD */}
                    <div className="mt-6 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenHourModal(eq)}
                        className="w-full bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        Atualizar Horímetro
                      </button>

                      <button
                        onClick={() => handleOpenMaintenanceModal(eq)}
                        className="w-full bg-sky-500 hover:bg-sky-400 text-white rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Fazer Preventiva
                      </button>

                      <button
                        onClick={() => setSelectedEqForHistory(eq)}
                        className="col-span-2 w-full bg-slate-950/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 rounded-xl py-1.5 text-xs flex items-center justify-center gap-2 transition-all mt-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        Ver Histórico da Máquinas ({eqLogsCount} registros)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA: HISTÓRICO COMPLETO */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-sky-400" />
                    Histórico do Sistema
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Consulte separadamente o registro de manutenções preventivas executadas e o histórico de atualização de horímetros.
                  </p>
                </div>

                <button
                  onClick={handleExportBackup}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  Exportar Relatório / CSV
                </button>
              </div>

              {/* SELEÇÃO DE CATEGORIA DE HISTÓRICO */}
              <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setHistoryLogType('ALL')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    historyLogType === 'ALL' ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  Todos os Registros ({logs.length})
                </button>
                <button
                  onClick={() => setHistoryLogType('PREVENTIVE')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    historyLogType === 'PREVENTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  Preventivas Executadas ({logs.filter(l => l.type === 'PREVENTIVE_DONE').length})
                </button>
                <button
                  onClick={() => setHistoryLogType('HOUR_UPDATE')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    historyLogType === 'HOUR_UPDATE' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 text-sky-400" />
                  Atualizações de Horímetro ({logs.filter(l => l.type === 'HOUR_UPDATE').length})
                </button>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Nenhum registro encontrado nesta categoria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Equipamento</th>
                        <th className="py-3 px-4">Tipo / Evento</th>
                        <th className="py-3 px-4">Plano / Detalhe</th>
                        <th className="py-3 px-4">Horímetro Registrado</th>
                        <th className="py-3 px-4">Data do Registro</th>
                        <th className="py-3 px-4">Responsável / Origem</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">#{log.equipmentId}</td>
                          <td className="py-3 px-4">
                            {log.type === 'PREVENTIVE_DONE' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Manutenção Executada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                <Clock className="w-3.5 h-3.5" />
                                Atualização de Horímetro
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-sky-400">
                            {log.plan || log.source || '-'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {log.executedAtHours ? `${log.executedAtHours} h` : log.value ? `${log.value} h` : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-200">
                            {log.date}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">
                            {log.technician || log.source || 'Sistema'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {log.type === 'PREVENTIVE_DONE' && (
                              <button
                                onClick={() => {
                                  setEditingLogDate(log);
                                  setNewLogDateValue(log.isoDate ? log.isoDate.slice(0, 16) : '');
                                }}
                                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
                              >
                                <Edit3 className="w-3 h-3 text-sky-400" />
                                Alterar Data
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-sky-400" /> Conexão e sincronização</h2>
            <p className="text-slate-400 text-sm">Os equipamentos e o histórico são compartilhados entre os acessos e salvos no banco de dados a cada alteração.</p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-sm">Último salvamento confirmado: <strong>{lastSavedTime || 'Nenhuma alteração nesta sessão'}</strong></div>
            <button onClick={loadData} className="bg-sky-500 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Atualizar dados da operação</button>
            <p className="text-xs text-slate-500">Se outra pessoa salvar uma alteração antes de você, os dados são recarregados para evitar sobrescrever o trabalho dela.</p>
          </section>
        )}

        {/* ABA: BACKUP E DADOS */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-sky-400" />
                    Gerenciamento de Dados e Importação JSON
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    O salvamento automático está <strong>permanentemente ativado</strong>. Cada alteração realizada nos 35 equipamentos é salva no banco de dados após a confirmação do servidor.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Auto-Save Continuo Ativo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <Upload className="w-6 h-6 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Importar Horímetros (JSON)</h3>
                  <p className="text-xs text-slate-400">Atualize os horímetros de todos os 35 equipamentos enviando um arquivo JSON.</p>
                  <label className="w-full bg-sky-500 hover:bg-sky-400 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer block shadow-lg shadow-sky-500/20">
                    Carregar Horímetros JSON
                    <input type="file" accept=".json" onChange={handleImportHoursJson} className="hidden" />
                  </label>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <Download className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Exportar Backup Completo</h3>
                  <p className="text-xs text-slate-400">Baixe um arquivo JSON com todas as leituras e históricos atuais.</p>
                  <button
                    onClick={handleExportBackup}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 px-4 rounded-xl text-xs font-bold transition-all"
                  >
                    Baixar Backup (.json)
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <FileText className="w-6 h-6 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Restaurar de Backup</h3>
                  <p className="text-xs text-slate-400">Carregue um arquivo JSON de backup para restaurar os dados completos.</p>
                  <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer block">
                    Selecionar Arquivo
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <RefreshCw className="w-6 h-6 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Restaurar Padrão de Fábrica</h3>
                  <p className="text-xs text-slate-400">Reseta a frota para os 35 equipamentos com os horímetros iniciais.</p>
                  <button
                    onClick={handleResetToFactory}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 py-2 px-4 rounded-xl text-xs font-bold transition-all"
                  >
                    Resetar Dados 35 Equip.
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-slate-300 mb-2">Exemplos de Formato JSON Aceitos para Importação (Mapeamento Automático):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-sky-300">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">Opção A (Lista de Objetos com status):</span>
{`[
  { "equipmentId": "4516", "currentHours": 476.0, "readingStatus": "available" },
  { "equipmentId": "4519", "currentHours": 768.2, "readingStatus": "available" }
]`}
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-emerald-300">
                    <span className="text-slate-500 block mb-1 font-sans font-semibold">Opção B (Chave-Valor Puro):</span>
{`{
  "4516": 476.0,
  "4519": 768.2
}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>}
      </main>

      {/* MODAL: ATUALIZAR HORÍMETRO */}
      {selectedEqForHourUpdate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-400" />
                Atualizar Horímetro Manual
              </h3>
              <button aria-label="Fechar janela" onClick={() => setSelectedEqForHourUpdate(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleHour} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Horímetro Atual do Equipamento #{selectedEqForHourUpdate.id} (h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newHourInput}
                  onChange={(e) => setNewHourInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEqForHourUpdate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20"
                >
                  Salvar Horímetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PREVENTIVA */}
      {selectedEqForMaintenance && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-sky-400" />
                  Registrar Preventiva Executada
                </h3>
                <p className="text-xs text-slate-400">Equipamento #{selectedEqForMaintenance.id}</p>
              </div>
              <button aria-label="Fechar janela" onClick={() => setSelectedEqForMaintenance(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterMaintenance} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Dia e Horário da Manutenção
                </label>
                <input
                  type="datetime-local"
                  required
                  value={maintDateInput}
                  onChange={(e) => setMaintDateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Horímetro de Realização (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={maintHoursInput}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setMaintHoursInput(e.target.value);
                      if (!isNaN(val)) {
                        const sug = calculateNextFixedPreventive(val);
                        setMaintPlanInput(`${Math.max(250, sug - 250)}h`);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Plano da Preventiva</label>
                  <select
                    value={maintPlanInput}
                    onChange={(e) => setMaintPlanInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {PREVENTIVE_PLANS.map(p => (
                      <option key={p} value={`${p}h`}>Preventiva {p} Horas</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl text-xs text-sky-300">
                <span className="font-bold">Sequência Fixa Automática:</span> Ao concluir a preventiva de <span className="font-extrabold text-white">{maintPlanInput}</span>, o próximo alvo será fixado exatamente em <span className="font-extrabold text-white">{(parseInt(maintPlanInput) || 250) + 250}h</span>.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Técnico Responsável / Mecânico</label>
                <input
                  type="text"
                  placeholder="Nome do técnico ou equipe..."
                  value={maintTechnician}
                  onChange={(e) => setMaintTechnician(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Observações da Preventiva</label>
                <textarea
                  rows="3"
                  placeholder="Troca de óleo, filtros, inspeção visual efetuada..."
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEqForMaintenance(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20"
                >
                  Concluir e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO INDIVIDUAL DA MÁQUINA */}
      {selectedEqForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-400" />
                  Histórico do Equipamento #{selectedEqForHistory.id}
                </h3>
                <p className="text-xs text-slate-400">Registros específicos desta máquina</p>
              </div>
              <button aria-label="Fechar janela" onClick={() => setSelectedEqForHistory(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* SELETOR INTERNO DO MODAL INDIVIDUAL */}
            <div className="flex items-center gap-2 mt-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setEqHistoryTab('PREVENTIVE')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  eqHistoryTab === 'PREVENTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                Preventivas Executadas ({logs.filter(l => l.equipmentId === selectedEqForHistory.id && l.type === 'PREVENTIVE_DONE').length})
              </button>
              <button
                onClick={() => setEqHistoryTab('HOUR_UPDATE')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  eqHistoryTab === 'HOUR_UPDATE' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Atualizações de Horímetro ({logs.filter(l => l.equipmentId === selectedEqForHistory.id && l.type === 'HOUR_UPDATE').length})
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {logs.filter(l => l.equipmentId === selectedEqForHistory.id && (eqHistoryTab === 'PREVENTIVE' ? l.type === 'PREVENTIVE_DONE' : l.type === 'HOUR_UPDATE')).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">Nenhum registro encontrado para esta categoria neste equipamento.</div>
              ) : (
                logs.filter(l => l.equipmentId === selectedEqForHistory.id && (eqHistoryTab === 'PREVENTIVE' ? l.type === 'PREVENTIVE_DONE' : l.type === 'HOUR_UPDATE')).map(item => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${item.type === 'PREVENTIVE_DONE' ? 'text-emerald-400' : 'text-sky-400'}`}>
                        {item.type === 'PREVENTIVE_DONE' ? (item.plan || 'Preventiva') : 'Atualização de Horímetro'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">{item.date}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Horímetro:</span> <strong className="text-white">{item.executedAtHours ?? item.value} h</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Responsável / Origem:</span> <strong className="text-slate-300">{item.technician || item.source || 'Sistema'}</strong>
                      </div>
                    </div>

                    {item.notes && <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">{item.notes}</p>}

                    {item.type === 'PREVENTIVE_DONE' && (
                      <div className="pt-2 text-right">
                        <button
                          onClick={() => {
                            setEditingLogDate(item);
                            setNewLogDateValue(item.isoDate ? item.isoDate.slice(0, 16) : '');
                          }}
                          className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                        >
                          <Edit3 className="w-3 h-3" /> Alterar Data deste Registro
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR DATA DA PREVENTIVA */}
      {editingLogDate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                Editar Data da Preventiva
              </h3>
              <button aria-label="Fechar janela" onClick={() => setEditingLogDate(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLogDate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Equipamento / Plano</label>
                <p className="text-sm font-bold text-white">Equipamento #{editingLogDate.equipmentId} — {editingLogDate.plan}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nova Data e Horário</label>
                <input
                  type="datetime-local"
                  required
                  value={newLogDateValue}
                  onChange={(e) => setNewLogDateValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLogDate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20"
                >
                  Salvar Nova Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}