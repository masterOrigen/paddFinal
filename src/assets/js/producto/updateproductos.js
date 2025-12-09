document.addEventListener('DOMContentLoaded', function() {
    const updateForm = document.getElementById('updateForm');
    const updateClientName = document.getElementById('updateClientName');
    const updateProductName = document.getElementById('updateProductName');
    const updateId = document.getElementById('updateId');
    let clientesMap = {};

    // Cargar el mapa de clientes al inicio
    cargarClientesMap();

    async function cargarClientesMap() {
        const headersList = {
            "Accept": "*/*",
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
                populateClientSelect();
            } else {
                throw new Error('No se pudieron obtener los clientes');
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    }

    function populateClientSelect() {
        updateClientName.innerHTML = '';
        for (let id in clientesMap) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = clientesMap[id];
            updateClientName.appendChild(option);
        }
    }

    window.loadClienteData = function(button) {
        const productId = button.getAttribute('data-idproducto');
        updateId.value = productId;

        // Fetch product data
        fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Productos?id=eq.${productId}`, {
            headers: {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const product = data[0];
                updateClientName.value = product.Id_Cliente;
                updateProductName.value = product.NombreDelProducto;
            }
        })
        .catch(error => console.error('Error:', error));
    }

    updateForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const productId = updateId.value;
        const clientId = updateClientName.value;
        const productName = updateProductName.value;

        const headersList = {
            "Accept": "*/*",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
            "Content-Type": "application/json"
        }

        const bodyContent = JSON.stringify({
            "NombreDelProducto": productName,
            "Id_Cliente": clientId
        });

        fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Productos?id=eq.${productId}`, {
            method: "PATCH",
            body: bodyContent,
            headers: headersList
        })
        .then(response => {
            if (response.ok) {
                Swal.fire({
                    title: 'Éxito!',
                    text: 'Producto actualizado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
                $('#modalupdate').modal('hide');
                window.location.reload();
            } else {
                throw new Error('No se pudo actualizar el producto');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Ocurrió un error al actualizar el producto',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        });
    });

 

  
});