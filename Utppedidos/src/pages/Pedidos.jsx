// src/pages/Pedidos.jsx - CÓDIGO LIMPIO Y CORREGIDO
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import backendApi from '../services/backendApi';
import Navbar from '../components/Navbar';

const Pedidos = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/pedidos');
      
      if (response.data.success) {
        setPedidos(response.data.data.pedidos || []);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedido = async (pedidoId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar este pedido?')) return;
    
    try {
      setProcesando(pedidoId);
      await backendApi.delete(`/pedidos/${pedidoId}`);
      await loadPedidos();
      alert('Pedido cancelado exitosamente');
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      alert('Error al cancelar el pedido: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcesando(null);
    }
  };

  const marcarComoRetirado = async (pedidoId) => {
    if (!window.confirm('¿Confirmas que has retirado este pedido?')) return;
    
    try {
      setProcesando(pedidoId);
      alert('Funcionalidad de confirmar retiro en desarrollo');
    } catch (error) {
      console.error('Error confirmando retiro:', error);
      alert('Error al confirmar retiro del pedido');
    } finally {
      setProcesando(null);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTiempoRestante = (fechaPedido, tiempoEstimado) => {
    const fechaEstimada = new Date(new Date(fechaPedido).getTime() + (tiempoEstimado * 60000));
    const ahora = new Date();
    const diferencia = fechaEstimada.getTime() - ahora.getTime();
    
    if (diferencia <= 0) return 'Listo para retirar';
    
    const minutos = Math.floor(diferencia / 60000);
    if (minutos < 60) return `${minutos} min restantes`;
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    return `${horas}h ${minutosRestantes}min restantes`;
  };

  const esExpirado = (fechaPedido, tiempoEstimado) => {
    const fechaEstimada = new Date(new Date(fechaPedido).getTime() + (tiempoEstimado * 60000));
    const fechaExpiracion = new Date(fechaEstimada.getTime() + (30 * 60000));
    return new Date() > fechaExpiracion;
  };

  const getEstadoInfo = (pedido) => {
    const esExp = esExpirado(pedido.fecha_pedido, pedido.tiempo_estimado);
    
    if (pedido.estado === 'Cancelado') {
      return { label: 'Cancelado', color: '#c62828', bgColor: '#ffebee' };
    }
    
    if (pedido.estado === 'Finalizado') {
      return { label: 'Completado', color: '#2e7d32', bgColor: '#e8f5e8' };
    }
    
    if (esExp && ['Pendiente', 'Confirmado', 'En Preparación', 'Por Retirar'].includes(pedido.estado)) {
      return { label: 'Expirado', color: '#f57c00', bgColor: '#fff3e0' };
    }
    
    return { label: 'Pendiente', color: '#1976d2', bgColor: '#e3f2fd' };
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (filtroActivo === 'todos') return true;
    
    const estadoInfo = getEstadoInfo(pedido);
    
    if (filtroActivo === 'pendientes') {
      return estadoInfo.label === 'Pendiente';
    }
    if (filtroActivo === 'completados') {
      return estadoInfo.label === 'Completado';
    }
    if (filtroActivo === 'cancelados') {
      return estadoInfo.label === 'Cancelado';
    }
    if (filtroActivo === 'expirados') {
      return estadoInfo.label === 'Expirado';
    }
    
    return true;
  });

  const contadores = {
    todos: pedidos.length,
    pendientes: pedidos.filter(p => getEstadoInfo(p).label === 'Pendiente').length,
    completados: pedidos.filter(p => getEstadoInfo(p).label === 'Completado').length,
    cancelados: pedidos.filter(p => getEstadoInfo(p).label === 'Cancelado').length,
    expirados: pedidos.filter(p => getEstadoInfo(p).label === 'Expirado').length
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ 
          padding: '40px',
          textAlign: 'center',
          fontSize: '1.1rem',
          color: '#666'
        }}>
          Cargando tus pedidos...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '20px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}>
        {/* Título */}
        <div style={{
          marginBottom: '25px'
        }}>
          <h1 style={{
            fontSize: '1.8rem',
            color: '#333',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📋 Mis Pedidos
          </h1>
        </div>

        {/* Filtros con contadores */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '25px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'todos', label: 'Todos', color: '#666' },
            { key: 'pendientes', label: 'Pendientes', color: '#1976d2' },
            { key: 'completados', label: 'Completados', color: '#2e7d32' },
            { key: 'expirados', label: 'Expirados', color: '#f57c00' },
            { key: 'cancelados', label: 'Cancelados', color: '#c62828' }
          ].map(filtro => (
            <button
              key={filtro.key}
              onClick={() => setFiltroActivo(filtro.key)}
              style={{
                padding: '8px 16px',
                background: filtroActivo === filtro.key ? filtro.color : '#f5f5f5',
                color: filtroActivo === filtro.key ? 'white' : filtro.color,
                borderRadius: '20px',
                fontSize: '0.9rem',
                border: `1px solid ${filtro.color}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {filtro.label} ({contadores[filtro.key]})
            </button>
          ))}
        </div>

        {/* Mensajes de error */}
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ef5350'
          }}>
            {error}
          </div>
        )}

        {/* Lista de pedidos */}
        {pedidosFiltrados.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f9f9f9',
            borderRadius: '12px',
            border: '2px dashed #ddd'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
              {filtroActivo === 'todos' ? '🛒' : 
               filtroActivo === 'pendientes' ? '⏳' :
               filtroActivo === 'completados' ? '✅' :
               filtroActivo === 'expirados' ? '⏰' : '❌'}
            </div>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>
              No tienes pedidos {filtroActivo === 'todos' ? '' : filtroActivo}
            </h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pedidosFiltrados.map((pedido) => {
              const estadoInfo = getEstadoInfo(pedido);
              const tiempoRestante = calcularTiempoRestante(pedido.fecha_pedido, pedido.tiempo_estimado);
              const puedeSerCancelado = ['Pendiente', 'Confirmado'].includes(pedido.estado) && estadoInfo.label !== 'Expirado';
              const puedeSerConfirmado = estadoInfo.label === 'Pendiente' && tiempoRestante === 'Listo para retirar';
              
              return (
                <div key={pedido.id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  {/* Header del pedido */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.1rem',
                        color: '#333',
                        margin: '0 0 5px 0'
                      }}>
                        Pedido #{pedido.id_pedido || pedido.id}
                      </h3>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        📅 {formatearFecha(pedido.fecha_pedido)}
                      </div>
                    </div>
                    
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      background: estadoInfo.bgColor,
                      color: estadoInfo.color
                    }}>
                      {estadoInfo.label}
                    </span>
                  </div>

                  {/* Información del pedido */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      🏪 <strong>{pedido.cafeteria_nombre || 'Cafetería'}</strong>
                    </div>
                    
                    {pedido.items && pedido.items.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        {pedido.items.map((item, index) => (
                          <div key={index} style={{
                            fontSize: '0.9rem',
                            color: '#333',
                            marginBottom: '3px'
                          }}>
                            {item.nombre} x{item.cantidad} - ${(item.precio_unitario * item.cantidad).toFixed(2)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      color: '#666',
                      marginBottom: '5px'
                    }}>
                      💳 {pedido.metodo_pago === 'efectivo' ? 'Efectivo' : 
                           pedido.metodo_pago === 'tarjeta' ? 'Tarjeta' : 
                           pedido.metodo_pago}
                    </div>
                    
                    {estadoInfo.label === 'Pendiente' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        color: tiempoRestante === 'Listo para retirar' ? '#2e7d32' : '#f57c00',
                        fontWeight: tiempoRestante === 'Listo para retirar' ? 'bold' : 'normal'
                      }}>
                        ⏱️ {tiempoRestante}
                      </div>
                    )}
                  </div>

                  {/* Footer con total y acciones */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#8A2BE2'
                    }}>
                      Total: ${pedido.total?.toFixed(2)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {puedeSerConfirmado && (
                        <button 
                          onClick={() => marcarComoRetirado(pedido.id)}
                          disabled={procesando === pedido.id}
                          style={{
                            padding: '8px 16px',
                            background: '#e8f5e8',
                            color: '#2e7d32',
                            border: '1px solid #c8e6c9',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            cursor: procesando === pedido.id ? 'not-allowed' : 'pointer',
                            opacity: procesando === pedido.id ? 0.6 : 1
                          }}
                        >
                          ✅ {procesando === pedido.id ? 'Procesando...' : 'Confirmar Retiro'}
                        </button>
                      )}
                      
                      {puedeSerCancelado && (
                        <button 
                          onClick={() => cancelarPedido(pedido.id)}
                          disabled={procesando === pedido.id}
                          style={{
                            padding: '8px 16px',
                            background: '#ffebee',
                            color: '#c62828',
                            border: '1px solid #ffcdd2',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            cursor: procesando === pedido.id ? 'not-allowed' : 'pointer',
                            opacity: procesando === pedido.id ? 0.6 : 1
                          }}
                        >
                          ❌ {procesando === pedido.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                      
                      <button style={{
                        padding: '8px 16px',
                        background: '#f5f5f5',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}>
                        👁️ Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pedidos;