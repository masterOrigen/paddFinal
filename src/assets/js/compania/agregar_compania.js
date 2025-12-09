async function guardarCompania(event) {
    event.preventDefault(); // Evita que el formulario se envíe automáticamente

    const form = document.getElementById('formularioAgregarCampania');
    const formData = new FormData(form);

    // Convertir FormData a un objeto JSON
    const jsonData = {};
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });
    
    const date = new Date();
    const fechaCreacion = date.toISOString().split('T')[0]; // Extracts the date part in YYYY-MM-DD format
    
    // Transformar los datos del formulario al formato requerido
    const transformedData = {
        "NombreCampania": jsonData.NombreCampania,
        "Anio": parseInt(jsonData.Anio, 10),
        "id_Cliente": parseInt(jsonData.cliente, 10),
        "Id_Agencia": parseInt(jsonData.Id_Agencia, 10),
        "id_Producto": parseInt(jsonData.id_Producto, 10),
        "Presupuesto": parseFloat(jsonData.Presupuesto),
        // "id_Temas": parseInt(jsonData.id_Temas, 10),
        "estado": true,
        "fechaCreacion": fechaCreacion
    };

    // URL y headers para la solicitud POST
    const url = 'https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Campania?select=*';
    const headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    };

    try {
        // Realizar la solicitud POST usando fetch
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(transformedData)
        });

        if (response.ok) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarCampania'));
            modal.hide();

            // Mostrar el mensaje de éxito usando SweetAlert con await
            await mostrarExito('Campaña agregada correctamente');

            showLoading();  // Muestra el efecto de carga

            // Recargar la página
            window.location.reload();

        } else {
            // Manejar el error de respuesta
            const errorData = await response.json();
            await Swal.fire({
                title: 'Error!',
                text: 'Hubo un error al enviar los datos: ' + errorData.message,
                icon: 'error',
                showConfirmButton: false,
                timer: 1500
            });
        }
    } catch (error) {
        // Manejar el error en la solicitud
        Swal.fire({
            title: 'Error!',
            text: `Error en la solicitud: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

async function mostrarExito(mensaje) {
    return new Promise((resolve) => {
        // Mostrar el mensaje de éxito y resolver la promesa cuando el SweetAlert se cierre
        Swal.fire({
            title: '¡Éxito!',
            text: mensaje,
            icon: 'success',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            resolve(); // Resuelve la promesa cuando se cierra el Swal
        });
    });
}

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

// Asigna el evento de envío al formulario
document.getElementById('formularioAgregarCampania').addEventListener('submit', guardarCompania);
