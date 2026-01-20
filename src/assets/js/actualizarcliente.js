import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

function getFormData() {
    const formData = new FormData(document.getElementById('formularioactualizarcliente'));
    const dataObject = {};
    formData.forEach((value, key) => {
        dataObject[key] = value;
    });
    console.log(dataObject, "hola"); // Imprime el objeto con los datos del formulario
    return {
        nombreCliente: dataObject.nombreCliente,
        nombreFantasia: dataObject.nombreFantasia,
        razonSocial: dataObject.razonSocial,
        grupo: dataObject.grupo,
        RUT: dataObject.RUT_info,
        giro: dataObject.giro,
        id_tipoCliente: dataObject.id_tipoCliente,
        nombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
        RUT_representante: dataObject.RUT_representante,
        direccionEmpresa: dataObject.direccionEmpresa,
        id_region: dataObject.id_region,
        id_comuna: dataObject.id_comuna,
        telCelular: dataObject.telCelular,
        telFijo: dataObject.telFijo,
        email: dataObject.email,
        formato: dataObject.formato,
        nombreMoneda: dataObject.nombreMoneda,
        valor: dataObject.valor
    };
}

async function submitForm(event) {
    event.preventDefault(); // Evita la recarga de la página
    let bodyContent = JSON.stringify(getFormData());
    console.log(bodyContent, "holacon");
    let idAgencia = document.querySelector('input[name="id_cliente"]').value;
    let headersList = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`
    };

    try {
        let response = await fetch(`${SUPABASE_URL}/rest/v1/Clientes?id_cliente=eq.${idAgencia}`, {
            method: "PATCH",
            body: bodyContent,
            headers: headersList
        });

        if (response.ok) {
            // Si la actualización fue exitosa
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'El cliente ha sido actualizado correctamente.',
                confirmButtonText: 'OK'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Cerrar el modal si existe
                    var modal = bootstrap.Modal.getInstance(document.getElementById('actualizarcliente'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Redirigir a ListClientes.php
                    window.location.href = 'ListClientes.php';
                }
            });
        } else {
            // Si hubo un error en la actualización
            const errorData = await response.json();
            console.error("Error:", errorData);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al actualizar el cliente. Por favor, inténtalo de nuevo.',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.',
            confirmButtonText: 'OK'
        });
    }
}

// Función para actualizar la tabla
async function updateTable() {
    try {
        let response = await fetch('ListClientes.php', { method: 'GET' });
        if (response.ok) {
            let html = await response.text();
            document.querySelector('.card-body').innerHTML = html;
        } else {
            console.error("Error al actualizar la tabla");
        }
    } catch (error) {
        console.error("Error al actualizar la tabla:", error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('formularioactualizarcliente').addEventListener('submit', submitForm);

    // Aquí puedes agregar cualquier otra inicialización necesaria
});