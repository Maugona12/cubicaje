import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
type Tire = {
  id: string;
  descripcion: string;
  peso: number;
  volumen: number;
  valor: number;
};
const tiresCollection = collection(db, 'tires');
type Truck = {
  economico: string;
  unidad: string;
  asignadoA: string;
  modelo: string;
  placas: string;
  ubicacion: string;
  carga: number;
  volumen: number;
};
const trucksCollection = collection(db, 'trucks');

type PedidoLlantas = {
  codigoLlanta: string;
  descripcion: string;
  cantidad: number;
  peso: number;
  volumen: number;
  valor: number;
};



const pedidosCollection = collection(db, 'pedidos');


const Orders: React.FC = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(tiresCollection, (snapshot) => {
      setTires(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Tire));
    });
    return () => unsubscribe();
  }, []);
  // Estado inicial vacío
  const [camion, setCamion] = useState<string>('');
  const [llantas, setLlantas] = useState<PedidoLlantas[]>([]);
  const [nuevaLlanta, setNuevaLlanta] = useState<PedidoLlantas>({ codigoLlanta: '', descripcion: '', cantidad: 1, peso: 0, volumen: 0, valor: 0 });
  // Sincronizar pedido en progreso con Firestore
  useEffect(() => {
    const draftRef = doc(db, 'pedidos_draft', 'draft');
    const unsubscribe = onSnapshot(draftRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        setCamion(data.camion || '');
        setLlantas(data.llantas || []);
        setNuevaLlanta(data.nuevaLlanta || { codigoLlanta: '', descripcion: '', cantidad: 1, peso: 0, volumen: 0, valor: 0 });
      }
    });
    return () => unsubscribe();
  }, []);
  // Guardar cambios en Firestore
  useEffect(() => {
    if (!camion && llantas.length === 0 && !nuevaLlanta.codigoLlanta) return;
    const draftRef = doc(db, 'pedidos_draft', 'draft');
    import('firebase/firestore').then(({ setDoc }) =>
      setDoc(draftRef, {
        camion,
        llantas,
        nuevaLlanta
      })
    );
  }, [camion, llantas, nuevaLlanta]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [alertaCamionAsignado, setAlertaCamionAsignado] = useState(false);

  // Cargar camiones y seleccionar automáticamente el camión por número económico
  useEffect(() => {
    const unsubscribe = onSnapshot(trucksCollection, (snapshot) => {
      const allTrucks = snapshot.docs.map(doc => ({ ...doc.data(), economico: doc.id }) as Truck);
      setTrucks(allTrucks);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!camion || camion.trim() === '') {
      setSelectedTruck(null);
      return;
    }
    const found = trucks.find(t => t.economico === camion.trim());
    setSelectedTruck(found || null);
  }, [camion, trucks]);

  // Verificar si el camión ya está asignado
  useEffect(() => {
    if (camion && pedidos.some(p => p.camion === camion.trim())) {
      setAlertaCamionAsignado(true);
      setSelectedTruck(null);
    } else {
      setAlertaCamionAsignado(false);
    }
  }, [camion, pedidos]);

  // Cargar y escuchar cambios en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(pedidosCollection, (snapshot) => {
      setPedidos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  // Actualiza campos de la llanta nueva
  const handleLlantaChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PedidoLlantas) => {
    let value = field === 'descripcion' || field === 'codigoLlanta' ? e.target.value : Number(e.target.value);
    let updated = { ...nuevaLlanta, [field]: value };
    // Si se cambia el código de llanta, autocompletar datos
    if (field === 'codigoLlanta') {
      const found = tires.find(t => t.id === value);
      if (found) {
        updated = {
          ...updated,
          descripcion: found.descripcion,
          peso: found.peso,
          volumen: found.volumen,
          valor: found.valor,
        };
      }
    }
    setNuevaLlanta(updated);
  };

  // Agrega llanta al pedido actual
  const handleAgregarLlanta = () => {
    setLlantas([...llantas, nuevaLlanta]);
    setNuevaLlanta({ codigoLlanta: '', descripcion: '', cantidad: 1, peso: 0, volumen: 0, valor: 0 });
  };

  // Calcula totales
  const totalVolumen = llantas.reduce((acc, l) => acc + l.volumen * l.cantidad, 0);
  const totalPeso = llantas.reduce((acc, l) => acc + l.peso * l.cantidad, 0);
  const totalValor = llantas.reduce((acc, l) => acc + l.valor * l.cantidad, 0);

  // Confirma pedido
  const handleConfirmarPedido = async () => {
    if (!camion || llantas.length === 0) return;
    await addDoc(pedidosCollection, {
      camion,
      llantas,
      totalVolumen,
      totalPeso,
      totalValor
    });
    setCamion('');
    setLlantas([]);
    setNuevaLlanta({ codigoLlanta: '', descripcion: '', cantidad: 1, peso: 0, volumen: 0, valor: 0 });
    setSelectedTruck(null);
    // Limpiar borrador en Firestore
    const draftRef = doc(db, 'pedidos_draft', 'draft');
    import('firebase/firestore').then(({ setDoc }) =>
      setDoc(draftRef, {
        camion: '',
        llantas: [],
        nuevaLlanta: { codigoLlanta: '', descripcion: '', cantidad: 1, peso: 0, volumen: 0, valor: 0 }
      })
    );
  };

  // Cancela pedido
  const handleCancelarPedido = async (idx: number) => {
    const pedido = pedidos[idx];
    const pedidoRef = doc(db, 'pedidos', pedido.id);
    await deleteDoc(pedidoRef);
  };

  // Utilidad para formato de dinero
  const formatMoney = (value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  // Calcula porcentaje de uso de volumen y peso
  let porcentajeVol = 0, porcentajePeso = 0, alerta = '';
  if (selectedTruck) {
    porcentajeVol = selectedTruck.volumen ? Math.round((totalVolumen / selectedTruck.volumen) * 100) : 0;
    porcentajePeso = selectedTruck.carga ? Math.round((totalPeso / selectedTruck.carga) * 100) : 0;
    if (porcentajeVol >= 100 && porcentajePeso >= 100) {
      alerta = '¡Camión lleno y sobrepeso!';
    } else if (porcentajeVol >= 100) {
      alerta = '¡Camión lleno!';
    } else if (porcentajePeso >= 100) {
      alerta = '¡Sobrepeso!';
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0002', padding: 24 }}>
      <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 8 }}>Comercializadora de Llantas Tres Siglos</h1>
      <h2 style={{ textAlign: 'center', color: '#3949ab', marginBottom: 24 }}>Pedidos</h2>
      <div style={{ marginBottom: 20 }}>
        <label>
          Número Económico del Camión:{' '}
          <input value={camion} onChange={e => setCamion(e.target.value)} placeholder="Ej: 123" />
        </label>
        {alertaCamionAsignado && (
          <div style={{ color: '#fff', background: '#d32f2f', borderRadius: 6, padding: '6px 12px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 1px 4px #0002', marginTop: 8 }}>
            ESTE CAMIÓN YA ESTÁ ASIGNADO
          </div>
        )}
        {selectedTruck && !alertaCamionAsignado && (
          <div style={{
            marginTop: 12,
            background: '#e3eafc',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 1px 4px #0001',
            color: '#1a237e',
            fontSize: 15,
            maxWidth: 600
          }}>
            <strong>Datos del Camión:</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              <li><b>ECONOMICO:</b> {selectedTruck.economico}</li>
              <li><b>UNIDAD:</b> {selectedTruck.unidad}</li>
              <li><b>ASIGNADO A:</b> {selectedTruck.asignadoA}</li>
              <li><b>MODELO:</b> {selectedTruck.modelo}</li>
              <li><b>PLACAS:</b> {selectedTruck.placas}</li>
              <li><b>UBICACION:</b> {selectedTruck.ubicacion}</li>
              <li><b>Cap. Carga:</b> {selectedTruck.carga} kg</li>
              <li><b>Cap. Volumen:</b> {selectedTruck.volumen} m³</li>
              {/* Eliminados Alto, Largo, Ancho */}
            </ul>
            <div style={{marginTop: 16}}>
              <div style={{marginBottom: 6}}>
                <b>Volumen ocupado:</b> {porcentajeVol}%
                <div style={{height: 16, background: '#eee', borderRadius: 8, overflow: 'hidden', marginTop: 2}}>
                  <div style={{width: `${Math.min(porcentajeVol, 100)}%`, height: '100%', background: porcentajeVol >= 100 ? '#d32f2f' : '#43a047', transition: 'width 0.3s'}}></div>
                </div>
              </div>
              <div style={{marginBottom: 6}}>
                <b>Peso ocupado:</b> {porcentajePeso}%
                <div style={{height: 16, background: '#eee', borderRadius: 8, overflow: 'hidden', marginTop: 2}}>
                  <div style={{width: `${Math.min(porcentajePeso, 100)}%`, height: '100%', background: porcentajePeso >= 100 ? '#d32f2f' : '#43a047', transition: 'width 0.3s'}}></div>
                </div>
              </div>
              {alerta && (
                <div style={{marginTop: 8, color: '#fff', background: '#d32f2f', borderRadius: 6, padding: '6px 12px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 1px 4px #0002'}}>
                  {alerta}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <h3>Agregar Llanta al Pedido</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f5f5f5', borderRadius: 8 }}>
        <thead style={{ background: '#3949ab', color: '#fff' }}>
          <tr>
            <th>Código Llanta</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Peso (kg)</th>
            <th>Volumen (m³)</th>
            <th>Valor $ Unitario</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><input value={nuevaLlanta.codigoLlanta} onChange={e => handleLlantaChange(e, 'codigoLlanta')} /></td>
            <td><input value={nuevaLlanta.descripcion} onChange={e => handleLlantaChange(e, 'descripcion')} /></td>
            <td><input type="number" value={nuevaLlanta.cantidad} min={1} onChange={e => handleLlantaChange(e, 'cantidad')} /></td>
            <td><input type="number" value={nuevaLlanta.peso} onChange={e => handleLlantaChange(e, 'peso')} /></td>
            <td><input type="number" value={nuevaLlanta.volumen} onChange={e => handleLlantaChange(e, 'volumen')} /></td>
            <td>
              <input
                type="text"
                value={formatMoney(Number(nuevaLlanta.valor) || 0)}
                onChange={e => {
                  const raw = e.target.value.replace(/[^\d.]/g, '');
                  handleLlantaChange({ ...e, target: { ...e.target, value: raw } }, 'valor');
                }}
              />
            </td>
            <td><button onClick={handleAgregarLlanta}>Agregar</button></td>
          </tr>
        </tbody>
      </table>
      <h4>Llantas en el Pedido</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f5f5f5', borderRadius: 8, marginTop: 16 }}>
        <thead style={{ background: '#3949ab', color: '#fff' }}>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Volumen Total</th>
            <th>Peso Total</th>
            <th>Valor Total</th>
            <th>Quitar</th>
          </tr>
        </thead>
        <tbody>
          {llantas.map((l: PedidoLlantas, idx: number) => (
            <tr key={idx}>
              <td>{l.codigoLlanta}</td>
              <td>{l.descripcion}</td>
              <td>
                <button style={{ padding: '0 6px', fontWeight: 'bold' }} onClick={() => {
                  if (l.cantidad > 1) {
                    const nuevas = llantas.map((ll, i) => i === idx ? { ...ll, cantidad: ll.cantidad - 1 } : ll);
                    setLlantas(nuevas);
                  }
                }}>-</button>
                {l.cantidad}
                <button style={{ padding: '0 6px', fontWeight: 'bold' }} onClick={() => {
                  const nuevas = llantas.map((ll, i) => i === idx ? { ...ll, cantidad: ll.cantidad + 1 } : ll);
                  setLlantas(nuevas);
                }}>+</button>
              </td>
              <td>{(l.volumen * l.cantidad).toFixed(2)}</td>
              <td>{(l.peso * l.cantidad).toFixed(2)}</td>
              <td>{formatMoney(l.valor * l.cantidad)}</td>
              <td>
                <button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={() => {
                  setLlantas(llantas.filter((_, i) => i !== idx));
                }}>Quitar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10 }}>
        <strong>Total Volumen:</strong> {totalVolumen.toFixed(2)} m³ | <strong>Total Peso:</strong> {totalPeso.toFixed(2)} kg | <strong>Total Valor:</strong> {formatMoney(totalValor)}
      </div>
      <button onClick={handleConfirmarPedido} disabled={!camion || llantas.length === 0} style={{ marginTop: 10, background: '#43a047', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 'bold' }}>Aceptar Pedido</button>
      <h3 style={{ marginTop: 32, color: '#3949ab' }}>Pedidos Confirmados</h3>
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
          {pedidos.map((p: any, idx: number) => (
            <tr key={idx}>
              <td>{p.camion}</td>
              <td>
                {p.llantas && p.llantas.map((l: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span><b>{l.codigoLlanta}</b> - {l.descripcion}</span> x
                    <button style={{ padding: '0 6px', fontWeight: 'bold' }} onClick={async () => {
                      if (l.cantidad > 1) {
                        const nuevasLlantas = p.llantas.map((ll: any, j: number) => j === i ? { ...ll, cantidad: ll.cantidad - 1 } : ll);
                        await updatePedidoLlantas(p.id, nuevasLlantas);
                      }
                    }}>-</button>
                    {l.cantidad}
                    <button style={{ padding: '0 6px', fontWeight: 'bold' }} onClick={async () => {
                      const nuevasLlantas = p.llantas.map((ll: any, j: number) => j === i ? { ...ll, cantidad: ll.cantidad + 1 } : ll);
                      await updatePedidoLlantas(p.id, nuevasLlantas);
                    }}>+</button>
                  </div>
                ))}
              </td>
              <td>{p.totalVolumen?.toFixed(2)}</td>
              <td>{p.totalPeso?.toFixed(2)}</td>
              <td>{p.totalValor?.toFixed(2)}</td>
              <td><button style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px' }} onClick={() => handleCancelarPedido(idx)}>Cancelar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;

async function updatePedidoLlantas(pedidoId: string, nuevasLlantas: any[]) {
  // Recalcula totales
  const totalVolumen = nuevasLlantas.reduce((acc, l) => acc + l.volumen * l.cantidad, 0);
  const totalPeso = nuevasLlantas.reduce((acc, l) => acc + l.peso * l.cantidad, 0);
  const totalValor = nuevasLlantas.reduce((acc, l) => acc + l.valor * l.cantidad, 0);
  await import('firebase/firestore').then(({ doc, updateDoc }) =>
    updateDoc(doc(db, 'pedidos', pedidoId), {
      llantas: nuevasLlantas,
      totalVolumen,
      totalPeso,
      totalValor
    })
  );
}
