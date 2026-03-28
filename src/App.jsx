import React, { useState, useEffect } from 'react'
import ConfigForm from './components/ConfigForm'

function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable(() => {
        setUpdateAvailable(true);
        setIsChecking(false);
      });

      window.electronAPI.onUpdateProgress((progress) => {
        setUpdateProgress(progress);
      });

      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateDownloaded(true);
      });

      window.electronAPI.onUpdateError((err) => {
        setUpdateError(err);
        setIsChecking(false);
      });
    }
  }, []);

  const handleRestart = () => {
    window.electronAPI.restartApp();
  };

  const checkUpdates = () => {
    setIsChecking(true);
    setUpdateError(null);
    window.electronAPI.checkUpdates();
    // Timeout por si no hay respuesta rápida de la API
    setTimeout(() => setIsChecking(false), 5000);
  };

  return (
    <div className="App" style={{ position: 'relative', height: '100vh' }}>
      {/* Botón de búsqueda manual en la esquina superior derecha */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
        <button 
          onClick={checkUpdates}
          disabled={isChecking}
          style={{
            padding: '8px 15px',
            backgroundColor: isChecking ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isChecking ? 'default' : 'pointer',
            fontSize: '12px'
          }}
        >
          {isChecking ? 'Buscando...' : '🔄 Buscar Actualización'}
        </button>
      </div>

      {/* Modal de Actualización TOTALMENTE BLOQUEANTE */}
      {(updateAvailable || updateDownloaded || updateError) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000, // Por encima de todo
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#2c3e50',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 10px 50px rgba(0,0,0,0.8)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ marginBottom: '20px' }}>
              {updateError ? '❌ Error en actualización' : 
               updateDownloaded ? '✅ Actualización lista' : 
               '📥 Descargando actualización...'}
            </h2>
            
            {!updateDownloaded && !updateError && (
              <div style={{ width: '100%', marginBottom: '20px' }}>
                <div style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: '#34495e',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${updateProgress}%`,
                    height: '100%',
                    backgroundColor: '#27ae60',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ marginTop: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                  {Math.round(updateProgress)}%
                </p>
              </div>
            )}

            {updateError && (
              <p style={{ color: '#e74c3c', marginBottom: '20px' }}>{updateError}</p>
            )}

            {updateDownloaded && (
              <p style={{ marginBottom: '25px', fontSize: '16px' }}>
                La nueva versión se ha descargado correctamente.<br/>
                <strong>Debe reiniciar la aplicación ahora para aplicar los cambios.</strong>
              </p>
            )}

            {(updateDownloaded || updateError) && (
              <button 
                onClick={handleRestart}
                style={{
                  padding: '15px 40px',
                  fontSize: '18px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              >
                {updateDownloaded ? 'REINICIAR Y ACTUALIZAR AHORA' : 'Cerrar y reintentar'}
              </button>
            )}
          </div>
        </div>
      )}

      <ConfigForm />
    </div>
  )
}

export default App
