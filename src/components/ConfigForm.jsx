import React, { useState, useEffect, useRef } from 'react';

const ConfigForm = () => {
  const [savedUser, setSavedUser] = useState('');
  const [savedPassword, setSavedPassword] = useState('');
  const [companies, setCompanies] = useState([]);
  const [tempUser, setTempUser] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth().toString().padStart(2, '0'));
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const isElectron = !!window.electronAPI;
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (isElectron) {
      window.electronAPI.loadConfig().then(config => {
        setSavedUser(config.user || '');
        setSavedPassword(config.password || '');
        setTempUser(config.user || '');
        setTempPassword(config.password || '');
        setCompanies(config.companies || []);
      });

      // Limpiamos los listeners anteriores antes de añadir nuevos
      const removeLogListener = window.electronAPI.onScriptLog((data) => {
        setLogs(prev => prev + data);
      });

      const removeFinishListener = window.electronAPI.onScriptFinished(() => {
        isRunningRef.current = false;
        setIsRunning(false);
      });

      return () => {
        if (removeLogListener) removeLogListener();
        if (removeFinishListener) removeFinishListener();
      };
    }
  }, [isElectron]);

  const saveConfigToDisk = (config) => {
    if (isElectron) window.electronAPI.saveConfig(config);
  };

  const handleSaveCreds = (e) => {
    e.preventDefault();
    setSavedUser(tempUser);
    setSavedPassword(tempPassword);
    saveConfigToDisk({ user: tempUser, password: tempPassword, companies });
    setShowConfigModal(false);
  };

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return;
    const newId = `id-${Date.now()}`;
    const newCompanies = [...companies, { name: newCompanyName, id: newId }];
    setCompanies(newCompanies);
    saveConfigToDisk({ user: savedUser, password: savedPassword, companies: newCompanies });
    setNewCompanyName('');
  };

  const handleRemoveCompany = (id) => {
    const newCompanies = companies.filter(c => c.id !== id);
    setCompanies(newCompanies);
    setSelectedCompanies(selectedCompanies.filter(cid => cid !== id));
    saveConfigToDisk({ user: savedUser, password: savedPassword, companies: newCompanies });
  };

  const toggleSelection = (id) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  const runSequentially = async (scriptName) => {
    if (selectedCompanies.length === 0 || isRunning) return;
    setIsRunning(true);
    isRunningRef.current = true;
    setLogs(`--- Iniciando descarga secuencial ---\n`);

    for (const companyId of selectedCompanies) {
      const company = companies.find(c => c.id === companyId);
      setLogs(prev => prev + `\n> PROCESANDO: ${company.name}...\n`);
      
      isRunningRef.current = true;
      setIsRunning(true);

      window.electronAPI.runScript(scriptName, {
        user: savedUser,
        password: savedPassword,
        companyName: company.name,
        month,
        year
      });

      await new Promise(resolve => {
        const check = setInterval(() => {
          if (!isRunningRef.current) {
            clearInterval(check);
            resolve();
          }
        }, 1000);
      });
    }
    setLogs(prev => prev + `\n--- TODAS LAS TAREAS FINALIZADAS ---\n`);
    setIsRunning(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '1000px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Onvio Helper 🚀</h1>
          <p style={{ color: savedUser ? '#2e7d32' : '#d32f2f', margin: '5px 0 0 0', fontWeight: 'bold' }}>
            {savedUser ? `🟢 Conectado como: ${savedUser}` : '🔴 Sin cuenta vinculada'}
          </p>
        </div>
        <button onClick={() => setShowConfigModal(true)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}>⚙️ Configuración</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3>🏢 Mis Empresas</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input placeholder="Nombre empresa..." value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <button onClick={handleAddCompany} style={{ padding: '10px', borderRadius: '6px', border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }}>+</button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
            {companies.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f9f9f9' }}>
                <input type="checkbox" checked={selectedCompanies.includes(c.id)} onChange={() => toggleSelection(c.id)} style={{ width: '18px', height: '18px' }} />
                <span style={{ marginLeft: '12px', flex: 1 }}>{c.name}</span>
                <button onClick={() => handleRemoveCompany(c.id)} style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ backgroundColor: '#fdfdfd', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3>📋 Panel de Control</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
            <span>Periodo:</span>
            <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '5px' }}>
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: '70px', padding: '5px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => runSequentially('descarga_totales_generales.js')} 
              disabled={isRunning || selectedCompanies.length === 0 || !savedUser}
              title="Descarga la planilla de Totales Generales.pdf"
              style={{ padding: '15px', fontSize: '1em', backgroundColor: (isRunning || !savedUser) ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: (isRunning || !savedUser) ? 'default' : 'pointer', fontWeight: 'bold' }}
            >
              {isRunning ? '⏳ Procesando...' : '📥 Descargar Totales Generales'}
            </button>
            <button 
              onClick={() => runSequentially('descarga_liquidaciones.js')} 
              disabled={isRunning || selectedCompanies.length === 0 || !savedUser}
              title="Descarga las liquidaciones detalladas en Excel"
              style={{ padding: '15px', fontSize: '1em', backgroundColor: (isRunning || !savedUser) ? '#ccc' : '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: (isRunning || !savedUser) ? 'default' : 'pointer', fontWeight: 'bold' }}
            >
              📥 Descargar Liquidaciones
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <strong>Logs:</strong>
            <pre style={{ backgroundColor: '#1e1e1e', color: '#4af626', padding: '15px', height: '350px', overflowY: 'auto', fontSize: '12px', borderRadius: '8px', marginTop: '10px', lineHeight: '1.4' }}>
              {logs || 'Listo.'}
            </pre>
          </div>
        </section>
      </div>

      {showConfigModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '400px' }}>
            <h2>⚙️ Configurar Onvio</h2>
            <form onSubmit={handleSaveCreds}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                <input type="text" value={tempUser} onChange={e => setTempUser(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña</label>
                <input type="password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
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
