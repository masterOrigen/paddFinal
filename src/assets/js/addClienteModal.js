import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

function getFormData() {
    const form = document.getElementById('formularioactualizarcliente');
    if (!form) {
        console.error('El formulario no se encontró');
        return {};
    }
    const formData = new FormData(form);
    const dataObject = {};
    formData.forEach((value, key) => {
        // Mapeo de nombres de campos del formulario a nombres de columnas en la base de datos
        switch(key) {
            case 'RUT_info':
                dataObject['RUT'] = value;
                break;
            case 'Rut_representante':
                dataObject['RUT_representante'] = value;
                break;
            default:
                dataObject[key] = value;
        }
    });
    console.log(dataObject, "Datos del formulario");
    return dataObject;
}

async function submitForm(event) {
    event.preventDefault();

    let dataObject = getFormData();
    let bodyContent = JSON.stringify(dataObject);
    console.log(bodyContent, "Datos a enviar");

    let idClienteInput = document.querySelector('input[name="id_cliente"]');
    if (!idClienteInput) {
        console.error('No se encontró el input del id_cliente');
        return;
    }
    let idCliente = idClienteInput.value;

    let headersList = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`
    };

    try {
        let response = await fetch(`${SUPABASE_URL}/rest/v1/Clientes?id_cliente=eq.${idCliente}`, {
            method: "PATCH",
            body: bodyContent,
            headers: headersList
        });

        if (response.ok) {
            showAlert({
                title: '¡Éxito!',
                text: 'El cliente ha sido actualizado correctamente.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            closeModal();
            updateTableRow(idCliente, dataObject);
        } else {
            const errorData = await response.json();
            console.error("Error:", errorData);
            showAlert({
                title: 'Error',
                text: 'Hubo un problema al actualizar el cliente. ' + (errorData.message || ''),
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Error:", error);
        showAlert({
            title: 'Error',
            text: 'Hubo un problema al procesar la solicitud.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// ... (el resto del código se mantiene igual)

function fillFormWithClienteData(clienteData) {
    const form = document.getElementById('formularioactualizarcliente');
    if (!form) {
        console.error('No se encontró el formulario para actualizar el cliente');
        return;
    }

    // Mapeo inverso de nombres de columnas de la base de datos a nombres de campos del formulario
    const fieldMapping = {
        'RUT': 'RUT',
        'RUT_representante': 'Rut_representante'
    };

    Object.keys(clienteData).forEach(key => {
        const formFieldName = fieldMapping[key] || key;
        const input = form.querySelector(`[name="${formFieldName}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = clienteData[key];
            } else {
                input.value = clienteData[key];
            }
        }
    });

    
}

