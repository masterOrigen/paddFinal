document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('agregarproducto');
    const tableBody = document.querySelector('#tableExportadora tbody');
    let clientesMap = {};
    
    // Cargar el mapa de clientes al inicio
    cargarClientesMap();
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const nombreProducto = form.nombreProducto.value;
        const idCliente = form.clientes.value;
        
        agregarProducto(nombreProducto, idCliente);
    });

    async function cargarClientesMap() {
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
        }

        try {
            const response = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Clientes?select=id_cliente,nombreCliente", {
                method: "GET",
                headers: headersList
            });

            if (response.ok) {
                const clientes = await response.json();
                clientesMap = clientes.reduce((map, cliente) => {
                    map[cliente.id_cliente] = cliente.nombreCliente;
                    return map;
                }, {});
            } else {
                throw new Error('No se pudieron obtener los clientes');
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    }

    async function agregarProducto(nombreProducto, idCliente) {
        const bodyContent = JSON.stringify({
            "NombreDelProducto": nombreProducto,
            "Id_Cliente": idCliente,
            "Estado": "1"
        });

        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
            "Content-Type": "application/json"
        }

        try {
            const response = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Productos", {
                method: "POST",
                body: bodyContent,
                headers: headersList
            });

            if (response.ok) {
                $('#modalagregar').modal('hide');
    
                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'Tema actualizado correctamente',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
    
                showLoading();
                location.reload();
            } else {
                throw new Error('No se pudo agregar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Ocurrió un error al agregar el producto',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        }
    }

    async function actualizarTabla() {
        const headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
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
                window.location.reload();
            } else {
                throw new Error('No se pudieron obtener los productos');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function actualizarTablaHTML(productos) {
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
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
});
function showLoading() {
    let loadingElement = document.getElementById('custom-loading');
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'custom-loading';
        loadingElement.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <img src="/assets/img/loading.gif" alt="Cargando..." style="width: 220px; height: 135px;">
            </div>
        `;
        document.body.appendChild(loadingElement);
    }
    loadingElement.style.display = 'block';
}