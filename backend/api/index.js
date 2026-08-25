const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Inicializar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Obtener todos los vehículos
app.get('/api/vehiculos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    const vehiculos = data.map(item => ({
      id: item.id,
      placa: item.placa,
      conductor: item.conductor,
      telefono: item.telefono,
      fechaSoat: item.fecha_soat,
      foto: item.foto
    }));

    res.json(vehiculos);
  } catch (error) {
    console.error('Error GET Supabase:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos en Supabase' });
  }
});

// POST: Crear un nuevo vehículo
app.post('/api/vehiculos', async (req, res) => {
  const { placa, conductor, telefono, fechaSoat, foto } = req.body;

  if (!placa || !conductor || !telefono || !fechaSoat) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const { data, error } = await supabase
      .from('vehiculos')
      .insert([
        {
          placa: placa,
          conductor: conductor,
          telefono: telefono,
          fecha_soat: fechaSoat,
          foto: foto
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Vehículo registrado exitosamente en Supabase',
      id: data[0].id
    });
  } catch (error) {
    console.error('Error POST Supabase:', error);
    res.status(500).json({ error: 'Error al guardar el registro' });
  }
});

// DELETE: Eliminar un vehículo por ID
app.delete('/api/vehiculos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('vehiculos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error('Error DELETE Supabase:', error);
    res.status(500).json({ error: 'Error al eliminar el registro' });
  }
});

// Si se ejecuta en local (con npm start), enciende el puerto 3000.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en local: http://localhost:${PORT}`);
  });
}

// Exportar para que Vercel pueda usarlo en producción
module.exports = app;