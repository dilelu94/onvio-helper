import React, { useState, useEffect } from 'react'
import ConfigForm from './components/ConfigForm'

function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable(() => {
        setUpdateAvailable(true);
      });

      window.electronAPI.onUpdateProgress((progress) => {
        setUpdateProgress(progress);
      });

      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateDownloaded(true);
      });

      window.electronAPI.onUpdateError((err) => {
        setUpdateError(err);
      });
    }
  }, []);

  const handleRestart = () => {
    window.electronAPI.restartApp();
  };

  return (
    <div className="App">
      {/* Modal de Actualización */}
      {(updateAvailable || updateDownloaded || updateError) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#2c3e50',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
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
                  height: '15px',
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
                <p style={{ marginTop: '10px' }}>{Math.round(updateProgress)}%</p>
              </div>
            )}

            {updateError && (
              <p style={{ color: '#e74c3c', marginBottom: '20px' }}>{updateError}</p>
            )}

            {updateDownloaded && (
              <p style={{ marginBottom: '25px' }}>
                La nueva versión se ha descargado correctamente. Debe reiniciar la aplicación para aplicar los cambios.
              </p>
            )}

            {(updateDownloaded || updateError) && (
              <button 
                onClick={handleRestart}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2ecc71'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
              >
                {updateDownloaded ? 'Reiniciar y actualizar' : 'Cerrar aplicación'}
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
