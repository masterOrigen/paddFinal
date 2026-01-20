// Configuración de la API
const API_URL = 'https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc';

// Headers para las peticiones a la API
const headersList = {
    "Content-Type": "application/json",
    "apikey": API_KEY,
    "Authorization": `Bearer ${API_KEY}`
};

// Función para mostrar el loading
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

// Función para ocultar el loading
function hideLoading() {
    const loadingElement = document.getElementById('custom-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Función para obtener los datos del cliente
async function getClienteData(idCliente) {
    try {
        console.log(`Solicitando datos para el cliente con ID: ${idCliente}`);
        const response = await fetch(`${API_URL}Clientes?id_cliente=eq.${idCliente}`, {
            method: "GET",
            headers: headersList
        });

        console.log('Respuesta de la API recibida:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Datos recibidos de la API:', data);
        
        if (data && data.length > 0) {
            console.log('Campos del cliente:', Object.keys(data[0]));
            console.log('Valor de RUT_representante:', data[0].RUT_representante);
            return data[0];
        } else {
            console.log("No se encontró el cliente con ID:", idCliente);
            return null;
        }
    } catch (error) {
        console.error("Error al obtener datos del cliente:", error);
        throw error;
    }
}

// Función para cargar los datos del cliente en el formulario
async function loadClienteDataView(button) {
    var idCliente = button.getAttribute('data-id-cliente');
    console.log('ID del cliente a cargar:', idCliente);
    
    // Limpiar el formulario antes de cargar nuevos datos
    cerrarModal();
    
    try {
        var cliente = await getClienteData(idCliente);
        console.log('Datos del cliente recibidos:', cliente);

        if (cliente && Object.keys(cliente).length > 0) {
            // Iterar sobre las propiedades del cliente y asignarlas a los campos del formulario
            Object.keys(cliente).forEach(key => {
                const inputField = document.getElementById(`update_${key}`);
                if (inputField) {
                    inputField.value = cliente[key] || '';
                    console.log(`Campo ${key} actualizado con valor: ${cliente[key]}`);
                } else {
                    console.warn(`No se encontró el campo para la propiedad ${key}`);
                }
            });

            // Verificación específica para RUT Representante
            const rutRepresentanteField = document.getElementById('update_RUT_representante');
            if (rutRepresentanteField) {
                if (cliente.RUT_representante) {
                    rutRepresentanteField.value = cliente.RUT_representante;
                    console.log('RUT Representante actualizado:', cliente.RUT_representante);
                } else {
                    console.warn('El campo RUT_representante está vacío en los datos del cliente');
                }
            } else {
                console.error('No se encontró el campo de entrada para RUT Representante');
            }

            // Asegurarse de que el campo id_cliente se actualice correctamente
            const idClienteField = document.getElementById('id_cliente');
            if (idClienteField) {
                idClienteField.value = cliente.id_cliente;
                console.log('ID del cliente actualizado:', cliente.id_cliente);
            } else {
                console.error('No se encontró el campo de entrada para id_cliente');
            }

            // Actualizar campos select si existen
            ['id_tipoCliente', 'id_region', 'id_comuna'].forEach(fieldName => {
                const selectField = document.getElementById(`update_${fieldName}`);
                if (selectField && cliente[fieldName]) {
                    selectField.value = cliente[fieldName];
                    console.log(`Campo select ${fieldName} actualizado con valor: ${cliente[fieldName]}`);
                }
            });

        } else {
            console.error("No se encontraron datos para el cliente con ID:", idCliente);
            alert(`No se encontraron datos para el cliente con ID: ${idCliente}`);
        }
    } catch (error) {
        console.error("Error detallado al cargar los datos del cliente:", error);
        alert(`Error al cargar los datos del cliente: ${error.message}`);
    }
}

// Función para obtener los datos del formulario
function getFormData() {
    const form = document.getElementById('updateClienteForm3');
    const formData = new FormData(form);
    const dataObject = Object.fromEntries(formData.entries());
    
    // Asegúrate de que los nombres de los campos coincidan exactamente con los de la base de datos
    if (dataObject.RUT_representante) {
        dataObject.RUT_representante = dataObject.RUT_representante.toUpperCase();
    }
    if (dataObject.RUT) {
        dataObject.RUT = dataObject.RUT.toUpperCase();
    }
    
    console.log(dataObject, "Datos del formulario para actualizar");
    return dataObject;
}

// Función para enviar el formulario de actualización
async function submitUpdateClienteForm(event) {
    event.preventDefault();

    const bodyContent = JSON.stringify(getFormData());
    const idCliente = document.getElementById('id_cliente').value;

    try {
        const response = await fetch(`${API_URL}Clientes?id_cliente=eq.${idCliente}`, {
            method: "PATCH",
            body: bodyContent,
            headers: headersList
        });

        if (response.ok) {
            // Mostrar SweetAlert de éxito con cierre automático
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Cliente actualizado correctamente',
                timer: 1500, // El alert se cerrará después de 1.5 segundos
                showConfirmButton: false // No muestra el botón de confirmación
            }).then(() => {
                // Cerrar el modal
                $('#actualizarclienteView').modal('hide');
                
                // Mostrar loading después de que se cierre el SweetAlert
                showLoading();
                
                // Recargar la página
                window.location.reload();
            });
        } else {
            const errorData = await response.json();
            console.error("Error:", errorData);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error al actualizar el cliente: ${errorData.message}`,
            });
        }
    } catch (error) {
        console.error("Error de red:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error de red, inténtelo nuevamente',
        });
    }
}

// Función optimizada para cerrar el modal
function cerrarModal() {
    const modal = document.getElementById('actualizarclienteView');
    if (modal) {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }

        // Remove backdrop and reset body styles
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
    
    // Limpiar todos los campos del formulario
    const form = document.getElementById('updateClienteForm3');
    if (form) {
        form.reset();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const updateClienteBtn = document.getElementById('updateClienteBtn');
    if (updateClienteBtn) {
        updateClienteBtn.addEventListener('click', submitUpdateClienteForm);
    }

    // Añadir event listeners a los botones de editar cliente
    const editButtons = document.querySelectorAll('.btn-editar-cliente');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            loadClienteDataView(this);
        });
    });

    // Añadir un event listener para cuando el modal se cierre
    const modal = document.getElementById('actualizarclienteView');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', cerrarModal);
    }

    // Ocultar el loading cuando la página haya cargado completamente
    window.addEventListener('load', hideLoading);
});