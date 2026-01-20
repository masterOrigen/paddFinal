import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

function getFormData() {
    const formData = new FormData(document.getElementById('formularioactualizarAge'));

    // Convertir FormData a objeto para imprimirlo
    const dataObject = {};
    formData.forEach((value, key) => {
        dataObject[key] = value;
    });

    console.log(dataObject, "hola"); // Imprime el objeto con los datos del formulario

    return {
        RazonSocial: dataObject.razonSocial,
        NombreDeFantasia: dataObject.nombreFantasia,
        RutAgencia: dataObject.rut,
        Giro: dataObject.giro,
        NombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
        Comuna: dataObject.id_comuna,
        Email: dataObject.email || null,
        estado: false,
        NombreIdentificador: dataObject.nombreIdentificador,
        telCelular: dataObject.telCelular,
        telFijo: dataObject.telFijo,
        Region: dataObject.id_region,
        DireccionAgencia: dataObject.direccionEmpresa,
        rutRepresentante: dataObject.rutRepresentante,
    };
}

// Función para enviar el formulario con PATCH
async function submitForm(event) {
    event.preventDefault(); // Evita la recarga de la página

    let bodyContent = JSON.stringify(getFormData());
    console.log(bodyContent, "holacon");

    let idAgencia = document.querySelector('input[name="id_agencia"]').value;

    let headersList = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`
    };

    let response = await fetch(`${SUPABASE_URL}/rest/v1/Agencias?id=eq.${idAgencia}`, {
        method: "PATCH",
        body: bodyContent,
        headers: headersList
    });

    if (response.ok) {
        // Si la actualización fue exitosa
        alert("Actualización correcta");
        // Redirigir a ListAgencia.php
        window.location.href = 'viewAgencia.php?id=' + idAgencia;
    } else {
        // Si hubo un error en la actualización
        const errorData = await response.json();
        console.error("Error:", errorData);
        alert("Error, intentelo nuevamente");
    }
}

// Función para actualizar la tabla
async function updateTable() {
    let response = await fetch('viewAgencia.php', { method: 'GET' });

    if (response.ok) {
        let html = await response.text();
        document.querySelector('.card-body').innerHTML = html;
    } else {
        console.error("Error al actualizar la tabla");
    }
}

