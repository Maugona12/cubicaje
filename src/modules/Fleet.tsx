import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

type Truck = {
  economico: string;
  unidad: string;
  asignadoA: string;
  modelo: string;
  placas: string;
  ubicacion: string;
  carga: number;
  volumen: number;
  // Eliminados alto, largo, ancho
};

const trucksCollection = collection(db, 'trucks');

const Fleet: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [searchEconomico, setSearchEconomico] = useState('');
  // Cargar y escuchar cambios en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(trucksCollection, (snapshot) => {
      setTrucks(snapshot.docs.map(doc => {
        const data = doc.data();
        // Si el campo economico existe, úsalo; si no, usa el id (compatibilidad)
        return { ...data, economico: data.economico || doc.id } as Truck;
      }));
    });
    return () => unsubscribe();
  }, []);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newTruck, setNewTruck] = useState<Truck>({
    economico: '', unidad: '', asignadoA: '', modelo: '', placas: '', ubicacion: '', carga: 0, volumen: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Truck, index?: number) => {
    if (index !== undefined) {
      const updated = [...trucks];
      updated[index] = { ...updated[index], [field]: field === 'economico' || field === 'unidad' || field === 'asignadoA' || field === 'modelo' || field === 'placas' || field === 'ubicacion' ? e.target.value : Number(e.target.value) };
      // Volumen se calcula automáticamente
      // El volumen se ingresa directamente
      setTrucks(updated);
    } else {
      const value = field === 'economico' || field === 'unidad' || field === 'asignadoA' || field === 'modelo' || field === 'placas' || field === 'ubicacion' ? e.target.value : Number(e.target.value);
      const updatedNew = { ...newTruck, [field]: value };
      // El volumen se ingresa directamente
      setNewTruck(updatedNew);
    }
  };

  const handleAdd = async () => {
    const { economico, ...rest } = newTruck;
    if (!economico) return;
    await setDoc(doc(trucksCollection, economico), { economico, ...rest });
    setNewTruck({ economico: '', unidad: '', asignadoA: '', modelo: '', placas: '', ubicacion: '', carga: 0, volumen: 0 });
  };

  const handleEdit = (idx: number) => setEditIndex(idx);
  const handleSave = async (idx: number) => {
    const truck = trucks[idx];
    const truckRef = doc(db, 'trucks', truck.economico);
    const { economico, ...rest } = truck;
    await updateDoc(truckRef, rest);
    setEditIndex(null);
  };
  const handleDelete = async (idx: number) => {
    const truck = trucks[idx];
    const truckRef = doc(db, 'trucks', truck.economico);
    await deleteDoc(truckRef);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0002', padding: 24 }}>
      <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 8 }}>Comercializadora de Llantas Tres Siglos</h1>
      <h2 style={{ textAlign: 'center', color: '#3949ab', marginBottom: 24 }}>Flota de Vehículos</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por número económico..."
          value={searchEconomico}
          onChange={e => setSearchEconomico(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', width: 300 }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f5f5f5', borderRadius: 8 }}>
        <thead style={{ background: '#3949ab', color: '#fff' }}>
          <tr>
            <th>ECONOMICO</th>
            <th>UNIDAD</th>
            <th>ASIGNADO A</th>
            <th>MODELO</th>
            <th>PLACAS</th>
            <th>UBICACION</th>
            <th>Cap. Carga (kg)</th>
            <th>Cap. Volumen (m³)</th>
            {/* Eliminados Alto, Largo, Ancho */}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {trucks.filter(truck => truck.economico.toLowerCase().includes(searchEconomico.toLowerCase())).map((truck, idx) => {
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
                    <td><input value={truck.economico} disabled style={{ background: '#eee' }} /></td>
                    <td><input value={truck.unidad} onChange={e => handleInputChange(e, 'unidad', idx)} /></td>
                    <td><input value={truck.asignadoA} onChange={e => handleInputChange(e, 'asignadoA', idx)} /></td>
                    <td><input value={truck.modelo} onChange={e => handleInputChange(e, 'modelo', idx)} /></td>
                    <td><input value={truck.placas} onChange={e => handleInputChange(e, 'placas', idx)} /></td>
                    <td><input value={truck.ubicacion} onChange={e => handleInputChange(e, 'ubicacion', idx)} /></td>
                    <td><input type="number" value={truck.carga} onChange={e => handleInputChange(e, 'carga', idx)} /></td>
                    <td>{truck.volumen.toFixed(2)}</td>
                    {/* Eliminados Alto, Largo, Ancho */}
                    <td>
                      <button style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', marginRight: 4 }} onClick={() => handleSave(idx)}>Guardar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td dangerouslySetInnerHTML={{ __html: highlight(truck.economico, searchEconomico) }}></td>
                    <td>{truck.unidad}</td>
                    <td>{truck.asignadoA}</td>
                    <td>{truck.modelo}</td>
                    <td>{truck.placas}</td>
                    <td>{truck.ubicacion}</td>
                    <td>{truck.carga}</td>
                    <td>{truck.volumen.toFixed(2)}</td>
                    {/* Eliminados Alto, Largo, Ancho */}
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
            <td><input value={newTruck.economico} onChange={e => handleInputChange(e, 'economico')} /></td>
            <td><input value={newTruck.unidad} onChange={e => handleInputChange(e, 'unidad')} /></td>
            <td><input value={newTruck.asignadoA} onChange={e => handleInputChange(e, 'asignadoA')} /></td>
            <td><input value={newTruck.modelo} onChange={e => handleInputChange(e, 'modelo')} /></td>
            <td><input value={newTruck.placas} onChange={e => handleInputChange(e, 'placas')} /></td>
            <td><input value={newTruck.ubicacion} onChange={e => handleInputChange(e, 'ubicacion')} /></td>
            <td><input type="number" value={newTruck.carga} onChange={e => handleInputChange(e, 'carga')} /></td>
            <td><input type="number" value={newTruck.volumen} onChange={e => handleInputChange(e, 'volumen')} /></td>
            {/* Eliminados Alto, Largo, Ancho */}
            <td><button style={{ background: '#ffb300', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={handleAdd}>Agregar</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Fleet;
