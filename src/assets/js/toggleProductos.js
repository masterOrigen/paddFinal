document.addEventListener('DOMContentLoaded', function() {
    const SUPABASE_URL = 'https://stnwcwzhazopsphgzkvl.supabase.co';
    const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bndjd3poYXpvcHNwaGd6a3ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MjY1MywiZXhwIjoyMDg0NDE4NjUzfQ.JJgSUKWpfm-IB37vtWsGsu9Z_37Mot8yW8oVnFC2iy4';

    // Función para actualizar el estado del cliente
    async function actualizarestadoContrato(productoID, nuevoEstado, toggleElement) {
        console.log(`Actualizando Contrato - ID: ${productoID}, Nuevo estado: ${nuevoEstado}`);
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/Productos?id=eq.${productoID}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ Estado: nuevoEstado })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            console.log('Estado actualizado con éxito en la base de datos');

            // Actualizar el estado del toggle en la UI
            toggleElement.checked = nuevoEstado;

            // Actualizar el título del tooltip
            const label = toggleElement.closest('label');
            if (label) {
                label.setAttribute('title', nuevoEstado ? 'Desactivar Producto' : 'Activar Producto');
                // Si estás usando Bootstrap tooltips, actualízalo
                $(label).tooltip('dispose').tooltip();
            }

            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: `El Producto ha sido ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`,
                showConfirmButton: false,
                timer: 1500
            });
             

        } catch (error) {
            console.error('Error al actualizar el estado:', error);
            
            // Revertir el estado del toggle en la UI
            toggleElement.checked = !nuevoEstado;
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el estado del Producto: ' + error.message
            });
        }
    }

    // Event listener para los toggles de estado
    document.querySelectorAll('.estado-switchP').forEach(toggleSwitch => {
        toggleSwitch.addEventListener('change', function(event) {
            const productoID = this.getAttribute('data-id');
            const nuevoEstado = this.checked;
            
            console.log(`Toggle cambiado - Producto ID: ${productoID}, Nuevo estado: ${nuevoEstado}`);
            
            // Prevenir el cambio inmediato del switch
            event.preventDefault();
            
            // Mostrar confirmación antes de actualizar
            Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Deseas ${nuevoEstado ? 'activar' : 'desactivar'} este Contrato?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cambiar estado!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    actualizarestadoContrato(productoID, nuevoEstado, this);
                } else {
                    // Si el usuario cancela, revertimos el estado del toggle
                    this.checked = !nuevoEstado;
                }
            });
        });
    });

    console.log('Script de toggle de estado de proveedores inicializado');
});

async function actualizarTabla() {
    const headersList = {
        "Accept": "*/*",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
    }

    try {
        const response = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Productos?select=*", {
            method: "GET",
            headers: headersList
        });

        if (response.ok) {
            const productos = await response.json();
            actualizarTablaHTML(productos);
        } else {
            throw new Error('No se pudieron obtener los productos');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function actualizarTablaHTML(productos) {
    const tableBody = document.querySelector('#tableExportadora tbody');
    tableBody.innerHTML = '';
    productos.forEach(producto => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${producto.id}</td>
            <td>${clientesMap[producto.Id_Cliente] || 'Cliente no encontrado'}</td>
            <td>${producto.NombreDelProducto}</td>
            <td>
                <div class="alineado">
                    <label class="custom-switch sino" data-toggle="tooltip" 
                        title="${producto.Estado ? 'Desactivar Producto' : 'Activar Producto'}">
                        <input type="checkbox" 
                            class="custom-switch-input estado-switchP"
                            data-id="${producto.id}" data-tipo="contrato" ${producto.Estado ? 'checked' : ''}>
                        <span class="custom-switch-indicator"></span>
                    </label>
                </div>
            </td>
            <td>
                <a href="views/viewproducto.php?id_producto=${producto.id}" data-toggle="tooltip" title="Ver Producto">
                    <i class="fas fa-eye btn btn-primary miconoz"></i>
                </a>
                <button type="button" class="btn btn-success micono" data-bs-toggle="modal" data-bs-target="#modalupdate" data-idproducto="${producto.id}" onclick="loadClienteData(this)">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}