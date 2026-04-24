import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

function getFormData() {
    const formData = new FormData(document.getElementById('regForm'));

    // Convertir FormData a objeto para imprimirlo
    const dataObject = {};
    formData.forEach((value, key) => {
        dataObject[key] = value;
    });

    console.log(dataObject, "hola"); // Imprime el objeto con los datos del formulario

    return {
        id_cliente: 5,
        created_at: new Date().toISOString(),
        nombreCliente: dataObject.nombreCliente,
        nombreFantasia: dataObject.nombreFantasia,
        razonSocial: dataObject.razonSocial,
        id_tipoCliente: dataObject.id_tipoCliente,
        grupo: dataObject.grupo,
        RUT: dataObject.RUT,
        giro: dataObject.giro,
        nombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
        RUT_representante: dataObject.Rut_representante,
        direccionEmpresa: dataObject.direccionEmpresa,
        id_region: dataObject.id_region,
        id_comuna: dataObject.id_comuna,
        telCelular: dataObject.telCelular,
        telFijo: dataObject.telFijo,
        estado: false,
        email: dataObject.email || null
    };
}


// Función para enviar el formulario
 function submitForm(event) {
    event.preventDefault(); // Evita la recarga de la página

    let bodyContent = JSON.stringify(getFormData());
    console.log(bodyContent,"holacon");
    let headersList = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`
    };
    let response = fetch(`${SUPABASE_URL}/rest/v1/Clientes`, { 
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    if (response.ok) {
        // Si el registro fue exitoso
        console.log("Registro correcto");
    } else {
        // Si hubo un error en el registro
        console.log("Error, intentelo nuevamente");
    }
}

// Asignar el evento de envío al botón "Siguiente"
document.getElementById('nextBtn').addEventListener('click', submitForm);