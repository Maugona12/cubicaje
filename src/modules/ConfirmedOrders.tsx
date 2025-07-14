// Utilidad para formato de dinero
const formatMoney = (value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

const pedidosCollection = collection(db, 'pedidos');

const ConfirmedOrders: React.FC = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(pedidosCollection, (snapshot) => {
      setPedidos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  const handleCancelarPedido = async (idx: number) => {
    const pedido = pedidos[idx];
    const pedidoRef = doc(db, 'pedidos', pedido.id);
    await deleteDoc(pedidoRef);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0002', padding: 24 }}>
      <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 8 }}>Comercializadora de Llantas Tres Siglos</h1>
      <h2 style={{ textAlign: 'center', color: '#3949ab', marginBottom: 24 }}>Pedidos Confirmados</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f5f5f5', borderRadius: 8 }}>
        <thead style={{ background: '#3949ab', color: '#fff' }}>
          <tr>
            <th>Camión</th>
            <th>Llantas</th>
            <th>Volumen</th>
            <th>Peso</th>
            <th>Valor</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p, idx) => (
            <tr key={p.id}>
              <td>{p.camion}</td>
              <td>
                {p.llantas && p.llantas.map((l: any, i: number) => (
                  <div key={i}>{l.codigoLlanta} x{l.cantidad}</div>
                ))}
              </td>
              <td>{p.totalVolumen?.toFixed(2)}</td>
              <td>{p.totalPeso?.toFixed(2)}</td>
              <td>{formatMoney(Number(p.totalValor) || 0)}</td>
              <td><button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={() => handleCancelarPedido(idx)}>Cancelar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConfirmedOrders;
