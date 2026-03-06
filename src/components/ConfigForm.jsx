import React, { useState, useEffect, useRef } from 'react';

const ConfigForm = () => {
  const [savedUser, setSavedUser] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [companies, setCompanies] = useState([]);
  const [tempUser, setTempUser] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyAlias, setNewCompanyAlias] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAlias, setEditAlias] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  
  const [currentCompanyStatus, setCurrentCompanyStatus] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [finalSummary, setFinalSummary] = useState('');
  const [showFullLogs, setShowFullLogs] = useState(false);
  const [accumulatedLogs, setAccumulatedLogs] = useState('');

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth().toString().padStart(2, '0'));
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Estados para el Modal de Confirmación con Tiempo
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null, onCancel: null });
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef(null);

  const isElectron = !!window.electronAPI;
  const isRunningRef = useRef(false);
  const lastExitCode = useRef(0);
  const fullLogsBuffer = useRef('');
  const currentProcessingData = useRef(null);

  useEffect(() => {
    if (isElectron) {
      window.electronAPI.loadConfig().then(config => {
        setSavedUser(config.user || '');
        setSavedPassword(config.password || '');
        setTempUser(config.user || '');
        setTempPassword(config.password || '');
        setCompanies(config.companies || []);
      });

      const removeLogListener = window.electronAPI.onScriptLog((data) => {
        fullLogsBuffer.current += data;
        setAccumulatedLogs(fullLogsBuffer.current);
        const lines = data.split('\n');
        const lastLogLine = lines.filter(l => l.includes('[LOG]')).pop();
        if (lastLogLine) setCurrentStep(lastLogLine.replace('[LOG]', '').trim());
        if (data.includes('[SUCCESS]')) {
          if (currentProcessingData.current) {
            window.electronAPI.dbAddRecord({
              ...currentProcessingData.current,
              path: data.split(':').pop().trim()
            });
          }
        }
        if (data.includes('[ERROR]')) {
          setCurrentStep('❌ ERROR');
          setShowFullLogs(true);
        }
      });

      const removeFinishListener = window.electronAPI.onScriptFinished((code) => {
        lastExitCode.current = code;
        isRunningRef.current = false;
        setIsRunning(false);
      });

      return () => {
        if (removeLogListener) removeLogListener();
        if (removeFinishListener) removeFinishListener();
      };
    }
  }, [isElectron]);

  const runSequentially = async (scriptName) => {
    if (selectedCompanies.length === 0 || isRunning) return;
    
    setIsRunning(true);
    isRunningRef.current = true;
    setShowFullLogs(false);
    setAccumulatedLogs('');
    fullLogsBuffer.current = '';
    setFinalSummary('');
    
    const failedCompanies = [];
    const initialSelection = [...selectedCompanies];
    const scriptType = scriptName.includes('totales') ? 'Totales' : 'Liquidaciones';

    for (const companyId of initialSelection) {
      const company = companies.find(c => c.id === companyId);
      const period = `${month}/${year}`;
      
      // 1. VERIFICACIÓN FÍSICA (OMISIÓN AUTOMÁTICA)
      const fileExists = await window.electronAPI.checkFileExists({ 
        year, period: `${month} ${year}`, alias: company.alias, type: scriptType 
      });

      if (fileExists) {
        setLogs(prev => prev + `\n[SKIP] ${company.alias} omitido (archivo ya presente en root).\n`);
        setSelectedCompanies(prev => prev.filter(id => id !== companyId));
        continue;
      }

      // 2. VERIFICACIÓN EN DB (MODAL DE CONFIRMACIÓN SI NO HAY ARCHIVO FÍSICO)
      const existing = await window.electronAPI.dbCheckRecord(company.alias, period, scriptType);
      
      if (existing) {
        const shouldDownload = await new Promise((resolve) => {
          setCountdown(10);
          setConfirmModal({
            show: true,
            message: `⚠️ ${company.alias} ya descargado el ${existing['Fecha Descarga']}.`,
            onConfirm: () => { resolve(true); setConfirmModal({ show: false }); },
            onCancel: () => { resolve(false); setConfirmModal({ show: false }); }
          });

          timerRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current);
                resolve(true); // AUTO-ACEPTAR
                setConfirmModal({ show: false });
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        });

        clearInterval(timerRef.current);
        if (!shouldDownload) {
          setSelectedCompanies(prev => prev.filter(id => id !== companyId));
          continue;
        }
      }

      setCurrentCompanyStatus(`Procesando: ${company.alias}`);
      currentProcessingData.current = { alias: company.alias, companyName: company.name, period, type: scriptType };

      window.electronAPI.runScript(scriptName, {
        user: savedUser, password: savedPassword, 
        companyName: company.name, companyAlias: company.alias, 
        month, year
      });

      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!isRunningRef.current) {
            if (lastExitCode.current === 0) {
              setSelectedCompanies(prev => prev.filter(id => id !== companyId));
            } else {
              failedCompanies.push(company.alias);
            }
            clearInterval(check);
            resolve();
          }
        }, 1000);
      });
    }

    setFinalSummary(failedCompanies.length === 0 ? `✨ ¡Completado con éxito!` : `⚠️ Errores en: ${failedCompanies.join(', ')}`);
    setCurrentCompanyStatus('');
    setCurrentStep('');
    setIsRunning(false);
  };

  const handleSaveCreds = (e) => {
    e.preventDefault();
    setSavedUser(tempUser); setSavedPassword(tempPassword);
    saveConfigToDisk(); setShowConfigModal(false);
  };

  const saveConfigToDisk = (newCompanies = companies) => {
    if (isElectron) window.electronAPI.saveConfig({ user: savedUser, password: savedPassword, companies: newCompanies });
  };

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return;
    const newCompanies = [...companies, { name: newCompanyName, alias: newCompanyAlias || newCompanyName, id: `id-${Date.now()}` }];
    setCompanies(newCompanies); saveConfigToDisk(newCompanies);
    setNewCompanyName(''); setNewCompanyAlias('');
  };

  const handleUpdateCompany = (id, field, value) => {
    const newCompanies = companies.map(c => c.id === id ? { ...c, [field]: value } : c);
    setCompanies(newCompanies); saveConfigToDisk(newCompanies);
  };

  const handleRemoveCompany = (id) => {
    const newCompanies = companies.filter(c => c.id !== id);
    setCompanies(newCompanies); setSelectedCompanies(selectedCompanies.filter(cid => cid !== id));
    saveConfigToDisk(newCompanies);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Onvio Helper 🚀</h1>
          <p style={{ color: savedUser ? 'green' : 'red' }}>{savedUser ? `🟢 ${savedUser}` : '🔴 Sin cuenta'}</p>
        </div>
        <button onClick={() => setShowConfigModal(true)}>⚙️ Cuenta</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <section style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3>🏢 Empresas</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input placeholder="Nombre" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} style={{ flex: 2, padding: '8px' }} />
            <input placeholder="Alias" value={newCompanyAlias} onChange={e => setNewCompanyAlias(e.target.value)} style={{ flex: 1, padding: '8px' }} />
            <button onClick={handleAddCompany}>+</button>
          </div>
          <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {companies.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', backgroundColor: editingId === c.id ? '#fff9db' : 'transparent' }}>
                <input type="checkbox" checked={selectedCompanies.includes(c.id)} onChange={() => setSelectedCompanies(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} />
                <div style={{ flex: 1, marginLeft: '10px' }}>
                  {editingId === c.id ? (
                    <input value={editAlias} onChange={e => setEditAlias(e.target.value)} style={{ width: '90%' }} />
                  ) : (
                    <b>{c.alias}</b>
                  )}
                  <div style={{ fontSize: '0.8em', color: '#666' }}>{c.name}</div>
                </div>
                {editingId === c.id ? (
                  <button onClick={() => { handleUpdateCompany(c.id, 'alias', editAlias); setEditingId(null); }}>✅</button>
                ) : (
                  <button onClick={() => { setEditingId(c.id); setEditAlias(c.alias); }}>✏️</button>
                )}
                <button onClick={() => handleRemoveCompany(c.id)} style={{ color: 'red' }}>✕</button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: '#fdfdfd', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3>📋 Panel</h3>
          <div style={{ marginBottom: '20px' }}>
            <select value={month} onChange={e => setMonth(e.target.value)}>{Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}</select>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: '70px', marginLeft: '5px' }} />
          </div>
          <button onClick={() => runSequentially('descarga_totales_generales.js')} disabled={isRunning || selectedCompanies.length === 0} style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', marginBottom: '10px' }}>📥 Totales Generales</button>
          <button onClick={() => runSequentially('descarga_liquidaciones.js')} disabled={isRunning || selectedCompanies.length === 0} style={{ width: '100%', padding: '10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}>📥 Liquidaciones</button>

          <div style={{ marginTop: '20px', background: '#1e1e1e', color: '#4af626', padding: '15px', borderRadius: '8px', minHeight: '100px' }}>
            {isRunning ? (<div><b>{currentCompanyStatus}</b><br/>{currentStep}</div>) : (finalSummary || 'Listo.')}
          </div>
        </section>
      </div>

      {/* MODAL DE CONFIRMACIÓN CON TIEMPO */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', maxWidth: '400px' }}>
            <h3>¿Descargar de nuevo?</h3>
            <p>{confirmModal.message}</p>
            <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#ff4d4f' }}>Descargando automáticamente en {countdown}s...</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={confirmModal.onConfirm} style={{ flex: 1, padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Descargar Ahora</button>
              <button onClick={confirmModal.onCancel} style={{ flex: 1, padding: '10px', background: '#eee', borderRadius: '5px' }}>Omitir Empresa</button>
            </div>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px' }}>
            <h2>Configuración</h2>
            <form onSubmit={handleSaveCreds}>
              <input type="text" value={tempUser} onChange={e => setTempUser(e.target.value)} placeholder="Email" style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
              <input type="password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="Pass" style={{ width: '100%', marginBottom: '20px', padding: '8px' }} />
              <button type="submit">Guardar</button>
              <button type="button" onClick={() => setShowConfigModal(false)}>Cerrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigForm;
