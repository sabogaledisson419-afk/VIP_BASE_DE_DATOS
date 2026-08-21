const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10
});

// GET: Obtener todos los vehículos
app.get('/api/vehiculos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehiculos ORDER BY id DESC');
    
    const vehiculos = rows.map(item => ({
      id: item.id,
      placa: item.placa,
      conductor: item.conductor,
      telefono: item.telefono,
      fechaSoat: item.fecha_soat ? item.fecha_soat.toISOString().split('T')[0] : '',
      foto: item.foto
    }));

    res.json(vehiculos);
  } catch (error) {
    console.error('Error GET:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// POST: Crear un nuevo vehículo
app.post('/api/vehiculos', async (req, res) => {
  const { placa, conductor, telefono, fechaSoat, foto } = req.body;

  if (!placa || !conductor || !telefono || !fechaSoat) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const query = `
      INSERT INTO vehiculos (placa, conductor, telefono, fecha_soat, foto)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [placa, conductor, telefono, fechaSoat, foto]);

    res.status(201).json({
      message: 'Vehículo registrado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error POST:', error);
    res.status(500).json({ error: 'Error al guardar el registro' });
  }
});

// DELETE: Eliminar un vehículo por ID
app.delete('/api/vehiculos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM vehiculos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error('Error DELETE:', error);
    res.status(500).json({ error: 'Error al eliminar el registro' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});


module.exports = app;