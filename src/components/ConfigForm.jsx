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

  const isElectron = !!window.electronAPI;
  const isRunningRef = useRef(false);
  const lastExitCode = useRef(0);
  const fullLogsBuffer = useRef('');

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
        if (data.includes('[SUCCESS]')) setCurrentStep('✅ ¡Completado!');
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

  const saveConfigToDisk = (newCompanies = companies) => {
    if (isElectron) window.electronAPI.saveConfig({ user: savedUser, password: savedPassword, companies: newCompanies });
  };

  const handleSaveCreds = (e) => {
    e.preventDefault();
    setSavedUser(tempUser);
    setSavedPassword(tempPassword);
    if (isElectron) window.electronAPI.saveConfig({ user: tempUser, password: tempPassword, companies });
    setShowConfigModal(false);
  };

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return;
    const newId = `id-${Date.now()}`;
    const newCompanies = [...companies, { name: newCompanyName, alias: newCompanyAlias || newCompanyName, id: newId }];
    setCompanies(newCompanies);
    saveConfigToDisk(newCompanies);
    setNewCompanyName('');
    setNewCompanyAlias('');
  };

  const startEditing = (company) => {
    setEditingId(company.id);
    setEditName(company.name);
    setEditAlias(company.alias);
  };

  const cancelEditing = () => setEditingId(null);

  const saveEdit = () => {
    const newCompanies = companies.map(c => c.id === editingId ? { ...c, name: editName, alias: editAlias } : c);
    setCompanies(newCompanies);
    saveConfigToDisk(newCompanies);
    setEditingId(null);
  };

  const handleRemoveCompany = (id) => {
    const newCompanies = companies.filter(c => c.id !== id);
    setCompanies(newCompanies);
    setSelectedCompanies(selectedCompanies.filter(cid => cid !== id));
    saveConfigToDisk(newCompanies);
  };

  const toggleSelection = (id) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

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

    for (const companyId of initialSelection) {
      const company = companies.find(c => c.id === companyId);
      setCurrentCompanyStatus(`Procesando: ${company.alias}`);
      setCurrentStep('Iniciando...');
      
      isRunningRef.current = true;
      setIsRunning(true);

      window.electronAPI.runScript(scriptName, {
        user: savedUser, password: savedPassword, 
        companyName: company.name, companyAlias: company.alias, 
        month, year
      });

      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!isRunningRef.current) {
            if (lastExitCode.current === 0) {
              // DESTILDAR SI TUVO ÉXITO
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

    if (failedCompanies.length === 0) {
      setFinalSummary(`✨ ¡Descargas completadas con éxito!`);
    } else {
      setFinalSummary(`⚠️ Proceso terminado con errores en: ${failedCompanies.join(', ')}`);
    }
    
    setCurrentCompanyStatus('');
    setCurrentStep('');
    setIsRunning(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '100%', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Onvio Helper 🚀</h1>
          <p style={{ color: savedUser ? '#2e7d32' : '#d32f2f', margin: '5px 0 0 0', fontWeight: 'bold' }}>
            {savedUser ? `🟢 Conectado como: ${savedUser}` : '🔴 Sin cuenta vinculada'}
          </p>
        </div>
        <button onClick={() => setShowConfigModal(true)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}>⚙️ Cuenta</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', minWidth: 0 }}>
          <h3>🏢 Mis Empresas</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input placeholder="Nombre Real" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <input placeholder="Alias" value={newCompanyAlias} onChange={e => setNewCompanyAlias(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <button onClick={handleAddCompany} style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }}>+</button>
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
            {companies.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f9f9f9', gap: '10px', backgroundColor: editingId === c.id ? '#fff9db' : 'transparent' }}>
                <input type="checkbox" checked={selectedCompanies.includes(c.id)} onChange={() => toggleSelection(c.id)} disabled={!!editingId} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === c.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <input value={editAlias} onChange={e => setEditAlias(e.target.value)} style={{ width: '100%' }} />
                      <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', fontSize: '0.8em' }} />
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.alias}</div>
                      <div style={{ fontSize: '0.75em', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {editingId === c.id ? (
                    <><button onClick={saveEdit} style={{ cursor: 'pointer' }}>✅</button><button onClick={cancelEditing} style={{ cursor: 'pointer' }}>❌</button></>
                  ) : (
                    <><button onClick={() => startEditing(c)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✏️</button><button onClick={() => handleRemoveCompany(c.id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>✕</button></>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ backgroundColor: '#fdfdfd', padding: '20px', borderRadius: '12px', border: '1px solid #eee', minWidth: 0 }}>
          <h3>📋 Panel de Control</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
            <span>Periodo:</span>
            <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '5px' }}>
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: '70px', padding: '5px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => runSequentially('descarga_totales_generales.js')} disabled={isRunning || selectedCompanies.length === 0 || !savedUser || !!editingId} style={{ padding: '15px', backgroundColor: (isRunning || !savedUser || !!editingId) ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Totales Generales</button>
            <button onClick={() => runSequentially('descarga_liquidaciones.js')} disabled={isRunning || selectedCompanies.length === 0 || !savedUser || !!editingId} style={{ padding: '15px', backgroundColor: (isRunning || !savedUser || !!editingId) ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Liquidaciones Detalladas</button>
          </div>

          <div style={{ marginTop: '25px', backgroundColor: '#1e1e1e', color: '#fff', borderRadius: '10px', padding: '20px', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            {isRunning && (
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#4af626' }}>{currentCompanyStatus}</div>
                <div style={{ fontSize: '0.9em', color: '#aaa' }}>{currentStep}</div>
              </div>
            )}
            {finalSummary && (
              <div style={{ color: finalSummary.includes('éxito') ? '#4af626' : '#ff4d4f', fontWeight: 'bold' }}>{finalSummary}</div>
            )}
            {showFullLogs && (
              <pre style={{ textAlign: 'left', fontSize: '11px', color: '#ccc', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap', marginTop: '15px', width: '100%' }}>{accumulatedLogs}</pre>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            {showFullLogs ? (
              <button onClick={() => setShowFullLogs(false)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.8em', marginTop: '10px' }}>Ocultar detalles</button>
            ) : (
              (isRunning || finalSummary) && <button onClick={() => setShowFullLogs(true)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.8em', marginTop: '10px' }}>Ver detalles</button>
            )}
          </div>
        </section>
      </div>

      {showConfigModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '400px' }}>
            <h2>⚙️ Configurar Onvio</h2>
            <form onSubmit={handleSaveCreds}>
              <div style={{ marginBottom: '15px' }}><label>Email</label><input type="text" value={tempUser} onChange={e => setTempUser(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: '20px' }}><label>Contraseña</label><input type="password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Vincular</button>
                <button type="button" onClick={() => setShowConfigModal(false)} style={{ flex: 1, padding: '12px', background: '#eee', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigForm;
