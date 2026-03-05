import React, { useState } from 'react';

const ConfigForm = () => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form>
      <div>
        <label htmlFor="usuario">Usuario</label>
        <input 
          id="usuario" 
          type="text" 
          value={user} 
          onChange={(e) => setUser(e.target.value)} 
        />
      </div>
      <div>
        <label htmlFor="contraseña">Contraseña</label>
        <input 
          id="contraseña" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>
      <button type="submit">Guardar</button>
    </form>
  );
};

export default ConfigForm;
