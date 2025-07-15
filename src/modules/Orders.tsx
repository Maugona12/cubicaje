import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

type Pedido = {
  camion: string;
  llantas: number;
  volumen: number;
  peso: number;
  valor: number;
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [newOrder, setNewOrder] = useState<Pedido>({
    camion: '', llantas: 0, volumen: 0, peso: 0, valor: 0
  });

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('public:pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('pedidos').select('*');
    if (!error && data) setOrders(data as Pedido[]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Pedido) => {
    const value = field === 'camion' ? e.target.value : Number(e.target.value);
    setNewOrder({ ...newOrder, [field]: value });
  };

  const handleAdd = async () => {
    if (!newOrder.camion) return;
    await supabase.from('pedidos').insert([newOrder]);
    setNewOrder({ camion: '', llantas: 0, volumen: 0, peso: 0, valor: 0 });
  };

  const handleDelete = async (idx: number) => {
    const pedido = orders[idx];
    await supabase.from('pedidos').delete().eq('camion', pedido.camion);
  };

  return (
    <div className="orders-responsive-container">
      <style>{`
        .orders-responsive-container {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 12px #0002;
          padding: 24px;
        }
        .orders-table {
          width: 100%;
          border-collapse: collapse;
          background: #f5f5f5;
          border-radius: 8px;
          overflow-x: auto;
          display: block;
        }
        .orders-table th, .orders-table td {
          padding: 8px 4px;
          font-size: 15px;
        }
        @media (max-width: 600px) {
          .orders-responsive-container {
            padding: 8px;
            border-radius: 0;
            box-shadow: none;
          }
          .orders-table th, .orders-table td {
            font-size: 13px;
            padding: 6px 2px;
          }
          .orders-table {
            font-size: 13px;
            min-width: 600px;
            border-radius: 0;
          }
          h1, h2 {
            font-size: 20px !important;
            margin-bottom: 10px !important;
          }
          input, button {
            font-size: 13px !important;
            padding: 4px 8px !important;
          }
        }
      `}</style>
      <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 8 }}>Comercializadora de Llantas Tres Siglos</h1>
      <h2 style={{ textAlign: 'center', color: '#3949ab', marginBottom: 24 }}>Pedidos Confirmados</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="orders-table">
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
            {orders.map((pedido, idx) => (
              <tr key={idx}>
                <td>{pedido.camion}</td>
                <td>{pedido.llantas}</td>
                <td>{pedido.volumen}</td>
                <td>{pedido.peso}</td>
                <td>{pedido.valor}</td>
                <td>
                  <button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={() => handleDelete(idx)}>Cancelar</button>
                </td>
              </tr>
            ))}
            <tr>
              <td><input value={newOrder.camion} onChange={e => handleInputChange(e, 'camion')} /></td>
              <td><input type="number" value={newOrder.llantas} onChange={e => handleInputChange(e, 'llantas')} /></td>
              <td><input type="number" value={newOrder.volumen} onChange={e => handleInputChange(e, 'volumen')} /></td>
              <td><input type="number" value={newOrder.peso} onChange={e => handleInputChange(e, 'peso')} /></td>
              <td><input type="number" value={newOrder.valor} onChange={e => handleInputChange(e, 'valor')} /></td>
              <td><button style={{ background: '#ffb300', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={handleAdd}>Agregar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;