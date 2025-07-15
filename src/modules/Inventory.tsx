import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

type Tire = {
  id: string;
  descripcion: string;
  peso: number;
  volumen: number;
  valor: number;
};

const Inventory: React.FC = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [searchId, setSearchId] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newTire, setNewTire] = useState<Tire>({
    id: '', descripcion: '', peso: 0, volumen: 0, valor: 0
  });

  useEffect(() => {
    fetchTires();
    const channel = supabase
      .channel('public:tires')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tires' }, () => {
        fetchTires();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTires = async () => {
    const { data, error } = await supabase.from('tires').select('*');
    if (!error && data) setTires(data as Tire[]);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    await supabase.from('tires').delete().neq('id', '');

    const nuevosTires: Tire[] = [];
    for (const row of rows) {
      const { id, descripcion, peso, volumen, valor } = row as any;
      if (id && descripcion && peso != null && volumen != null && valor != null) {
        await supabase.from('tires').insert([{
          id: String(id),
          descripcion: String(descripcion),
          peso: Number(peso),
          volumen: Number(volumen),
          valor: Number(valor)
        }]);
        nuevosTires.push({
          id: String(id),
          descripcion: String(descripcion),
          peso: Number(peso),
          volumen: Number(volumen),
          valor: Number(valor)
        });
      }
    }
    setTires(nuevosTires);
    e.target.value = '';
    alert('Inventario importado correctamente');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Tire, index?: number) => {
    if (index !== undefined) {
      const updated = [...tires];
      updated[index] = { ...updated[index], [field]: field === 'id' || field === 'descripcion' ? e.target.value : Number(e.target.value) };
      setTires(updated);
    } else {
      const value = field === 'id' || field === 'descripcion' ? e.target.value : Number(e.target.value);
      const updatedNew = { ...newTire, [field]: value };
      setNewTire(updatedNew);
    }
  };

  const handleAdd = async () => {
    if (!newTire.id) return;
    await supabase.from('tires').insert([newTire]);
    setNewTire({ id: '', descripcion: '', peso: 0, volumen: 0, valor: 0 });
  };

  const handleEdit = (idx: number) => setEditIndex(idx);

  const handleSave = async (idx: number) => {
    const tire = tires[idx];
    await supabase.from('tires').update({
      descripcion: tire.descripcion,
      peso: tire.peso,
      volumen: tire.volumen,
      valor: tire.valor
    }).eq('id', tire.id);
    setEditIndex(null);
  };

  const handleDelete = async (idx: number) => {
    const tire = tires[idx];
    await supabase.from('tires').delete().eq('id', tire.id);
  };

  return (
    <div className="inventory-responsive-container">
      <style>{`
        .inventory-responsive-container {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 12px #0002;
          padding: 24px;
        }
        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          background: #f5f5f5;
          border-radius: 8px;
          overflow-x: auto;
          display: block;
        }
        .inventory-table th, .inventory-table td {
          padding: 8px 4px;
          font-size: 15px;
        }
        @media (max-width: 600px) {
          .inventory-responsive-container {
            padding: 8px;
            border-radius: 0;
            box-shadow: none;
          }
          .inventory-table th, .inventory-table td {
            font-size: 13px;
            padding: 6px 2px;
          }
          .inventory-table {
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 14, color: '#3949ab', fontWeight: 'bold', marginRight: 8 }}>Importar Excel:</label>
        <input type="file" accept=".xlsx,.xls" style={{ width: 140 }} onChange={handleImportExcel} />
      </div>
      <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 8 }}>Comercializadora de Llantas Tres Siglos</h1>
      <h2 style={{ textAlign: 'center', color: '#3949ab', marginBottom: 24 }}>Inventario de Llantas</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por ID..."
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', width: '100%', maxWidth: 300 }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="inventory-table">
          <thead style={{ background: '#3949ab', color: '#fff' }}>
            <tr>
              <th>ID</th>
              <th>DESCRIPCIÓN</th>
              <th>PESO (kg)</th>
              <th>VOLUMEN (m³)</th>
              <th>VALOR ($)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tires.filter(tire => tire.id.toLowerCase().includes(searchId.toLowerCase())).map((tire, idx) => {
              const highlight = (text: string, search: string) => {
                if (!search) return text;
                const regex = new RegExp(`(${search})`, 'gi');
                return text.replace(regex, '<mark style="background: #ffe082; color: #222; padding: 0 2px; border-radius: 2px;">$1</mark>');
              };
              return (
                <tr key={idx}>
                  {editIndex === idx ? (
                    <>
                      <td><input value={tire.id} disabled style={{ background: '#eee' }} /></td>
                      <td><input value={tire.descripcion} onChange={e => handleInputChange(e, 'descripcion', idx)} /></td>
                      <td><input type="number" value={tire.peso} onChange={e => handleInputChange(e, 'peso', idx)} /></td>
                      <td><input type="number" value={tire.volumen} onChange={e => handleInputChange(e, 'volumen', idx)} /></td>
                      <td><input type="number" value={tire.valor} onChange={e => handleInputChange(e, 'valor', idx)} /></td>
                      <td>
                        <button style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', marginRight: 4 }} onClick={() => handleSave(idx)}>Guardar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td dangerouslySetInnerHTML={{ __html: highlight(tire.id, searchId) }}></td>
                      <td>{tire.descripcion}</td>
                      <td>{tire.peso}</td>
                      <td>{tire.volumen}</td>
                      <td>{tire.valor}</td>
                      <td>
                        <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', marginRight: 4 }} onClick={() => handleEdit(idx)}>Editar</button>
                        <button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={() => handleDelete(idx)}>Eliminar</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            <tr>
              <td><input value={newTire.id} onChange={e => handleInputChange(e, 'id')} /></td>
              <td><input value={newTire.descripcion} onChange={e => handleInputChange(e, 'descripcion')} /></td>
              <td><input type="number" value={newTire.peso} onChange={e => handleInputChange(e, 'peso')} /></td>
              <td><input type="number" value={newTire.volumen} onChange={e => handleInputChange(e, 'volumen')} /></td>
              <td><input type="number" value={newTire.valor} onChange={e => handleInputChange(e, 'valor')} /></td>
              <td><button style={{ background: '#ffb300', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={handleAdd}>Agregar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;