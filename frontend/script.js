document.addEventListener('DOMContentLoaded', () => {
  // Cambiar esta URL a tu endpoint en Vercel cuando esté desplegado
  const API_URL = 'http://localhost:3000/api/vehiculos';

  const form = document.getElementById('vehicle-form');
  const fotoInput = document.getElementById('foto');
  const imagePreview = document.getElementById('image-preview');
  const tableBody = document.getElementById('table-body');
  const tableContainer = document.getElementById('table-container');
  const authBtn = document.getElementById('auth-btn');
  const adminStatusText = document.getElementById('admin-status-text');

  const ADMIN_PASSWORD = 'admin'; 
  let currentImageDataUrl = '';
  let isAdmin = sessionStorage.getItem('is_admin') === 'true';

  updateAdminUI();

  authBtn.addEventListener('click', () => {
    if (isAdmin) {
      isAdmin = false;
      sessionStorage.setItem('is_admin', 'false');
      alert('Has cerrado sesión de administrador.');
    } else {
      const passwordEntered = prompt('Ingresa la contraseña de administrador:');
      if (passwordEntered === ADMIN_PASSWORD) {
        isAdmin = true;
        sessionStorage.setItem('is_admin', 'true');
        alert('Acceso concedido como Administrador.');
      } else if (passwordEntered !== null) {
        alert('Contraseña incorrecta.');
      }
    }
    updateAdminUI();
  });

  function updateAdminUI() {
    if (isAdmin) {
      tableContainer.classList.remove('hidden');
      authBtn.textContent = 'Cerrar Sesión';
      adminStatusText.innerHTML = 'Modo: <strong style="color: #16a34a;">Administrador</strong>';
      loadVehiclesFromAPI();
    } else {
      tableContainer.classList.add('hidden');
      authBtn.textContent = 'Acceso Administrador';
      adminStatusText.innerHTML = 'Modo: <strong>Usuario (Solo Registro)</strong>';
    }
  }

  fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentImageDataUrl = event.target.result;
        imagePreview.src = currentImageDataUrl;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newVehicle = {
      placa: document.getElementById('placa').value.toUpperCase(),
      conductor: document.getElementById('conductor').value,
      telefono: document.getElementById('telefono').value,
      fechaSoat: document.getElementById('fecha-soat').value,
      foto: currentImageDataUrl
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle)
      });

      if (!response.ok) throw new Error('Error al registrar');

      alert('Vehículo registrado correctamente en Supabase.');

      if (isAdmin) {
        loadVehiclesFromAPI();
      }

      form.reset();
      imagePreview.style.display = 'none';
      imagePreview.src = '#';
      currentImageDataUrl = '';

    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al enviar los datos a Supabase.');
    }
  });

  async function loadVehiclesFromAPI() {
    try {
      const response = await fetch(API_URL);
      const vehicles = await response.json();
      
      tableBody.innerHTML = '';

      if (!Array.isArray(vehicles) || vehicles.length === 0) {
        tableBody.innerHTML = `
          <tr id="empty-row">
            <td colspan="6" class="empty-message">No hay vehículos registrados todavía.</td>
          </tr>
        `;
        return;
      }

      vehicles.forEach(vehicle => {
        const status = getSoatStatus(vehicle.fechaSoat);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><img src="${vehicle.foto}" alt="Foto ${vehicle.placa}" class="table-img"></td>
          <td><strong>${vehicle.placa}</strong></td>
          <td>${vehicle.conductor}</td>
          <td>${vehicle.telefono || 'N/A'}</td>
          <td><span class="badge-soat ${status.class}">${status.text}</span></td>
          <td><button class="delete-btn" data-id="${vehicle.id}">Eliminar</button></td>
        `;

        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
          deleteVehicleFromAPI(vehicle.id);
        });

        tableBody.appendChild(row);
      });

    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }

  async function deleteVehicleFromAPI(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar');

      loadVehiclesFromAPI();
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar el vehículo.');
    }
  }

  function getSoatStatus(fechaSoatStr) {
    if (!fechaSoatStr) return { text: 'Sin fecha', class: '' };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [year, month, day] = fechaSoatStr.split('-');
    const fechaSoat = new Date(year, month - 1, day);

    const diffTiempo = fechaSoat - hoy;
    const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { text: `${fechaSoatStr} (Vencido)`, class: 'badge-vencido' };
    } else if (diffDias <= 30) {
      return { text: `${fechaSoatStr} (Próximo a vencer - ${diffDias} días)`, class: 'badge-proximo' };
    } else {
      return { text: `${fechaSoatStr} (Vigente)`, class: 'badge-vigente' };
    }
  }
});