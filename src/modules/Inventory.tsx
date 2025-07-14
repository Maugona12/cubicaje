// Utilidad para formato de dinero
const formatMoney = (value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

type Tire = {
  id: string;
  descripcion: string;
  peso: number;
  volumen: number;
  valor: number;
};

const tiresCollection = collection(db, 'tires');

const Inventory: React.FC = () => {
  // Importar Excel y llenar toda la tabla
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    // Limpiar toda la colección antes de importar
    const batchDelete = async () => {
      const { getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(tiresCollection);
      snapshot.forEach((docSnap: any) => {
        deleteDoc(doc(db, 'tires', docSnap.id));
      });
    };
    await batchDelete();
    // Importar todos los llantas del Excel
    const nuevosTires: Tire[] = [];
    for (const row of rows) {
      const { id, descripcion, peso, volumen, valor } = row as any;
      if (id && descripcion && peso != null && volumen != null && valor != null) {
        await setDoc(doc(tiresCollection, String(id)), {
          descripcion: String(descripcion),
          peso: Number(peso),
          volumen: Number(volumen),
          valor: Number(valor)
        });
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
  const [tires, setTires] = useState<Tire[]>([]);
  const [searchId, setSearchId] = useState('');
  // Cargar y escuchar cambios en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(tiresCollection, (snapshot) => {
      setTires(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Tire));
    });
    return () => unsubscribe();
  }, []);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newTire, setNewTire] = useState<Tire>({
    id: '', descripcion: '', peso: 0, volumen: 0, valor: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Tire, index?: number) => {
    if (index !== undefined) {
      const updated = [...tires];
      updated[index] = { ...updated[index], [field]: field === 'descripcion' || field === 'id' ? e.target.value : Number(e.target.value) };
      setTires(updated);
    } else {
      const value = field === 'descripcion' || field === 'id' ? e.target.value : Number(e.target.value);
      const updatedNew = { ...newTire, [field]: value };
      setNewTire(updatedNew);
    }
  };

  const handleAdd = async () => {
    const { id, ...rest } = newTire;
    if (!id) return;
    await setDoc(doc(tiresCollection, id), rest);
    setNewTire({ id: '', descripcion: '', peso: 0, volumen: 0, valor: 0 });
  };

  const handleEdit = (idx: number) => setEditIndex(idx);
  const handleSave = async (idx: number) => {
    const tire = tires[idx];
    const tireRef = doc(db, 'tires', tire.id);
    const { id, ...rest } = tire;
    await updateDoc(tireRef, rest);
    setEditIndex(null);
  };
  const handleDelete = async (idx: number) => {
    const tire = tires[idx];
    const tireRef = doc(db, 'tires', tire.id);
    await deleteDoc(tireRef);
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
          placeholder="Buscar llanta por ID..."
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', width: '100%', maxWidth: 300 }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="inventory-table">
          <thead style={{ background: '#3949ab', color: '#fff' }}>
            <tr>
              <th>ID Llanta</th>
              <th>Descripción</th>
              <th>Peso (kg)</th>
              <th>Volumen Unitario (m³)</th>
              <th>Valor $ Unitario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tires.filter(tire => tire.id.toLowerCase().includes(searchId.toLowerCase())).map((tire, idx) => {
              // Función para resaltar coincidencias
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
                      <td>
                        <input
                          type="text"
                          value={formatMoney(Number(tire.valor) || 0)}
                          onChange={e => {
                            // Permitir solo números y puntos
                            const raw = e.target.value.replace(/[^\d.]/g, '');
                            handleInputChange({ ...e, target: { ...e.target, value: raw } }, 'valor', idx);
                          }}
                        />
                      </td>
                      <td>
                        <button style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', marginRight: 4 }} onClick={() => handleSave(idx)}>Guardar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td dangerouslySetInnerHTML={{ __html: highlight(tire.id, searchId) }}></td>
                      <td>{tire.descripcion}</td>
                      <td>{tire.peso}</td>
                      <td>{tire.volumen.toFixed(2)}</td>
                      <td>{formatMoney(Number(tire.valor) || 0)}</td>
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
              <td>
                <input
                  type="text"
                  value={formatMoney(Number(newTire.valor) || 0)}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d.]/g, '');
                    handleInputChange({ ...e, target: { ...e.target, value: raw } }, 'valor');
                  }}
                />
              </td>
              <td><button style={{ background: '#ffb300', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={handleAdd}>Agregar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
