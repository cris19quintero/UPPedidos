// src/pages/FirebaseSetup.jsx
import React, { useState } from 'react';
import { setupFirebaseDatabase, testFirebaseConnection } from '../utils/firebaseSetup';

function FirebaseSetup() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSetupDatabase = async () => {
    setLoading(true);
    setStatus('Configurando base de datos...');
    
    try {
      await setupFirebaseDatabase();
      setStatus('¡Base de datos configurada exitosamente!');
    } catch (error) {
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setStatus('Probando conexión...');
    
    try {
      const isConnected = await testFirebaseConnection();
      if (isConnected) {
        setStatus('✅ Conexión exitosa con Firebase!');
      } else {
        setStatus('❌ No se pudo conectar con Firebase');
      }
    } catch (error) {
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      textAlign: 'center',
      background: 'white',
      borderRadius: '12px',
      marginTop: '50px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#7b1fa2', marginBottom: '30px' }}>
        🔥 Configuración de Firebase
      </h1>
      
      <p style={{ marginBottom: '30px', color: '#666' }}>
        Utiliza estos botones para configurar la base de datos de Firebase
      </p>
      
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
        <button
          onClick={handleTestConnection}
          disabled={loading}
          style={{
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {loading ? 'Probando...' : '🔍 Probar Conexión'}
        </button>
        
        <button
          onClick={handleSetupDatabase}
          disabled={loading}
          style={{
            background: '#7b1fa2',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          {loading ? 'Configurando...' : '🚀 Configurar Base de Datos'}
        </button>
      </div>
      
      {status && (
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          margin: '20px 0',
          border: '1px solid #dee2e6'
        }}>
          <strong>{status}</strong>
        </div>
      )}
      
      <div style={{ 
        textAlign: 'left', 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <h4>📋 Qué hace este script:</h4>
        <ul>
          <li>✅ Crea las colecciones de cafeterías</li>
          <li>✅ Añade los menús para cada cafetería</li>
          <li>✅ Crea un usuario de ejemplo</li>
          <li>✅ Configura la estructura completa de la BD</li>
        </ul>
        
        <h4>⚠️ Importante:</h4>
        <ul>
          <li>Solo ejecuta una vez</li>
          <li>Asegúrate de tener la configuración de Firebase correcta</li>
          <li>Revisa la consola del navegador para logs detallados</li>
        </ul>
      </div>
    </div>
  );
}

export default FirebaseSetup;