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
  const [showUpdateModal, setShowUpdateModal] = useState({ show: false, script: '' });
  const [month, setMonth] = useState(new Date().getMonth().toString().padStart(2, '0'));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [updateValue, setUpdateValue] = useState('1637');
  const [updateDate, setUpdateDate] = useState('01/03/2026');

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
    // 1. Intentar cargar desde localStorage primero para feedback instantáneo
    const cachedCompanies = localStorage.getItem('onvio_companies');
    const cachedUser = localStorage.getItem('onvio_user');
    if (cachedCompanies) setCompanies(JSON.parse(cachedCompanies));
    if (cachedUser) {
      setSavedUser(cachedUser);
      setTempUser(cachedUser);
    }

    if (isElectron) {
      // 2. Cargar la "verdad" desde Electron (archivo físico)
      window.electronAPI.loadConfig().then(config => {
        if (config) {
          const companiesFromConfig = config.companies || [];
          const userFromConfig = config.user || '';
          
          setSavedUser(userFromConfig);
          setSavedPassword(config.password || '');
          setTempUser(userFromConfig);
          setTempPassword(config.password || '');
          setCompanies(companiesFromConfig);

          // Sincronizar backup
          localStorage.setItem('onvio_companies', JSON.stringify(companiesFromConfig));
          localStorage.setItem('onvio_user', userFromConfig);
        }
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
    let scriptType = 'Actualización';
    if (scriptName.includes('totales')) scriptType = 'Totales';
    else if (scriptName.includes('liquidaciones')) scriptType = 'Liquidaciones';

    for (const companyId of initialSelection) {
      const company = companies.find(c => c.id === companyId);
      const period = `${month}/${year}`;
      
      // 1. VERIFICACIÓN FÍSICA (Solo para descargas)
      if (scriptType !== 'Actualización') {
        const fileExists = await window.electronAPI.checkFileExists({ 
          year, period: `${month} ${year}`, alias: company.alias, type: scriptType 
        });

        if (fileExists) {
          setAccumulatedLogs(prev => prev + `\n[SKIP] ${company.alias} omitido (archivo ya presente en Escritorio).\n`);
          setSelectedCompanies(prev => prev.filter(id => id !== companyId));
          continue;
        }
      }

      // 2. VERIFICACIÓN EN DB (MODAL DE CONFIRMACIÓN SI NO HAY ARCHIVO FÍSICO)
      // Solo para scripts de descarga (Totales o Liquidaciones)
      if (scriptType !== 'Actualización') {
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
      }

      setCurrentCompanyStatus(`Procesando: ${company.alias}`);
      currentProcessingData.current = { alias: company.alias, companyName: company.name, period, type: scriptType };

      window.electronAPI.runScript(scriptName, {
        user: savedUser, password: savedPassword, 
        companyName: company.name, companyAlias: company.alias, 
        month, year,
        updateValue, updateDate
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
    const newUser = tempUser;
    const newPass = tempPassword;
    
    setSavedUser(newUser); 
    setSavedPassword(newPass);
    localStorage.setItem('onvio_user', newUser);
    
    // Guardamos directamente con los valores nuevos
    if (isElectron) {
      window.electronAPI.saveConfig({ 
        user: newUser, 
        password: newPass, 
        companies: companies 
      });
    }
    setShowConfigModal(false);
  };

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return;
    const newCompany = { 
      name: newCompanyName, 
      alias: newCompanyAlias || newCompanyName, 
      id: `id-${Date.now()}` 
    };
    const newCompanies = [...companies, newCompany];
    
    setCompanies(newCompanies);
    localStorage.setItem('onvio_companies', JSON.stringify(newCompanies));
    
    // Guardamos la lista actualizada inmediatamente
    if (isElectron) {
      window.electronAPI.saveConfig({ 
        user: savedUser, 
        password: savedPassword, 
        companies: newCompanies 
      });
    }
    
    setNewCompanyName(''); 
    setNewCompanyAlias('');
  };

  const handleUpdateCompany = (id, field, value) => {
    const newCompanies = companies.map(c => c.id === id ? { ...c, [field]: value } : c);
    setCompanies(newCompanies);
    localStorage.setItem('onvio_companies', JSON.stringify(newCompanies));
    if (isElectron) {
      window.electronAPI.saveConfig({ 
        user: savedUser, 
        password: savedPassword, 
        companies: newCompanies 
      });
    }
  };

  const handleRemoveCompany = (id) => {
    const newCompanies = companies.filter(c => c.id !== id);
    setCompanies(newCompanies); 
    localStorage.setItem('onvio_companies', JSON.stringify(newCompanies));
    setSelectedCompanies(selectedCompanies.filter(cid => cid !== id));
    if (isElectron) {
      window.electronAPI.saveConfig({ 
        user: savedUser, 
        password: savedPassword, 
        companies: newCompanies 
      });
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>🏢 Empresas</h3>
            {companies.length > 0 && (
              <label style={{ fontSize: '0.85em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedCompanies.length === companies.length && companies.length > 0} 
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCompanies(companies.map(c => c.id));
                    else setSelectedCompanies([]);
                  }} 
                />
                <b>Seleccionar Todas</b>
              </label>
            )}
          </div>
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
            <button onClick={() => setShowUpdateModal({ show: true, script: 'descarga_totales_generales.js' })} disabled={isRunning || selectedCompanies.length === 0} style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', marginBottom: '10px' }}>📥 Totales Generales</button>
            <button onClick={() => setShowUpdateModal({ show: true, script: 'descarga_liquidaciones.js' })} disabled={isRunning || selectedCompanies.length === 0} style={{ width: '100%', padding: '10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', marginBottom: '20px' }}>📥 Liquidaciones</button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowUpdateModal({ show: true, script: 'actualiza_scvo.js' })} disabled={isRunning || selectedCompanies.length === 0} style={{ flex: 1, padding: '10px', background: '#9c27b0', color: 'white', border: 'none', borderRadius: '5px' }}>🔄 Actualizar SCVO</button>
              <button onClick={() => setShowUpdateModal({ show: true, script: 'actualiza_artfija.js' })} disabled={isRunning || selectedCompanies.length === 0} style={{ flex: 1, padding: '10px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '5px' }}>🔄 Actualizar ARTFIJA</button>
            </div>
          </div>

          <div style={{ 
            marginTop: '20px', 
            background: '#1e1e1e', 
            color: '#4af626', 
            padding: '15px', 
            borderRadius: '8px', 
            height: '200px', 
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.85em',
            whiteSpace: 'pre-wrap'
          }}>
            {accumulatedLogs || (isRunning ? 'Iniciando...' : 'Esperando comandos...')}
            <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
          </div>
        </section>
      </div>

      {/* MODAL DE PARÁMETROS DE PROCESO */}
      {showUpdateModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Parámetros de {showUpdateModal.script.includes('descarga') ? 'Descarga' : 'Actualización'}</h3>
            
            {showUpdateModal.script.includes('descarga') ? (
              /* CAMPOS PARA DESCARGA */
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mes:</label>
                  <select value={month} onChange={e => setMonth(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px' }}>
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Año:</label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                </div>
              </div>
            ) : (
              /* CAMPOS PARA ACTUALIZACIÓN */
              <>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Monto:</label>
                  <input value={updateValue} onChange={e => setUpdateValue(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha (01/MM/AAAA):</label>
                  <input value={updateDate} onChange={e => setUpdateDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => {
                  const script = showUpdateModal.script;
                  setShowUpdateModal({ show: false, script: '' });
                  runSequentially(script);
                }} 
                style={{ flex: 2, padding: '12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
              >
                🚀 Iniciar Proceso
              </button>
              <button 
                onClick={() => setShowUpdateModal({ show: false, script: '' })} 
                style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '5px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
