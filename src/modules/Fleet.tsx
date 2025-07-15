import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

type Truck = {
  camion: string;
  modelo: string;
  capacidad: number;
};

const Fleet: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [newTruck, setNewTruck] = useState<Truck>({
    camion: '', modelo: '', capacidad: 0
  });

  useEffect(() => {
    fetchTrucks();
    const channel = supabase
      .channel('public:trucks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' }, () => {
        fetchTrucks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTrucks = async () => {
    const { data, error } = await supabase.from('trucks').select('*');
    if (!error && data) setTrucks(data as Truck[]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Truck) => {
    const value = field === 'camion' || field === 'modelo' ? e.target.value : Number(e.target.value);
    setNewTruck({ ...newTruck, [field]: value });
  };

  const handleAdd = async () => {
    if (!newTruck.camion) return;
    await supabase.from('trucks').insert([newTruck]);
    setNewTruck({ camion: '', modelo: '', capacidad: 0 });
  };

  const handleDelete = async (idx: number) => {
    const truck = trucks[idx];
    await supabase.from('trucks').delete().eq('camion', truck.camion);
  };

  return (
    <div className="fleet-responsive-container">
      <style>{`
        .fleet-responsive-container {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 12px #0002;
          padding: 24px;
        }
        .fleet-table {
          width: 100%;
          border-collapse: collapse;
          background: #f5f5f5;
          border-radius: 8px;
          overflow-x: auto;
          display: block;
        }
        .fleet-table th, .fleet-table td {
          padding: 8px 4px;
          font-size: 15px;
        }
        @media (max-width: 600px) {
          .fleet-responsive-container {
            padding: 8px;
            border-radius: 0;
            box-shadow: none;
          }
          .fleet-table th, .fleet-table td {
            font-size: 13px;
            padding: 6px 2px;
          }
          .fleet-table {
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
      <h2 style={{ textAlign: 'center', color: '#3949ab', marginBottom: 24 }}>Flota de Camiones</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="fleet-table">
          <thead style={{ background: '#3949ab', color: '#fff' }}>
            <tr>
              <th>Camión</th>
              <th>Modelo</th>
              <th>Capacidad</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map((truck, idx) => (
              <tr key={idx}>
                <td>{truck.camion}</td>
                <td>{truck.modelo}</td>
                <td>{truck.capacidad}</td>
                <td>
                  <button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={() => handleDelete(idx)}>Eliminar</button>
                </td>
              </tr>
            ))}
            <tr>
              <td><input value={newTruck.camion} onChange={e => handleInputChange(e, 'camion')} /></td>
              <td><input value={newTruck.modelo} onChange={e => handleInputChange(e, 'modelo')} /></td>
              <td><input type="number" value={newTruck.capacidad} onChange={e => handleInputChange(e, 'capacidad')} /></td>
              <td><button style={{ background: '#ffb300', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={handleAdd}>Agregar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Fleet;