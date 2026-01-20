function loadProveedorDataSoporte(button) {
    var idSoporte = button.getAttribute('data-id-soporte');
    var soporte = getSoporteData(idSoporte);

    if (soporte) {
        console.log('Datos del soporte:', soporte);
        console.log(soporte.nombreIdentficiador,"Holaa");
        document.querySelector('input[name="rutProveedorx"]').value = soporte.id_proveedor;
        document.querySelector('input[name="nombreIdentificadorx"]').value = soporte.nombreIdentficiador;
        document.querySelector('input[name="nombreFantasiax"]').value = soporte.nombreFantasia;
        document.querySelector('input[name="rutSoporte"]').value = soporte.rut_soporte;
        document.querySelector('input[name="giroProveedorx"]').value = soporte.giro;
        document.querySelector('input[name="nombreRepresentantex"]').value = soporte.nombreRepresentanteLegal;
        document.querySelector('input[name="rutRepresentantex"]').value = soporte.rutRepresentante;
        document.querySelector('input[name="razonSocialx"]').value = soporte.razonSocial;
        document.querySelector('input[name="direccionx"]').value = soporte.direccion;
        document.querySelector('select[name="id_regionx"]').value = soporte.id_region;
        document.querySelector('select[name="id_comunax"]').value = soporte.id_comuna;
        document.querySelector('input[name="telCelularx"]').value = soporte.telCelular;
        document.querySelector('input[name="telFijox"]').value = soporte.telFijo;
        document.querySelector('input[name="emailx"]').value = soporte.email;
        document.querySelector('input[name="bonificacion_anox"]').value = soporte.bonificacion_ano;
        document.querySelector('input[name="escala_rangox"]').value = soporte.escala;

       
    } else {
        console.log("No se encontró el proveedor con ID:", idSoporte);
    }
}

function getFormData4() {
    const formData = new FormData(document.getElementById('formularioactualizarSoporte'));

    // Convertir FormData a objeto para imprimirlo
    const dataObject = {};
    formData.forEach((value, key) => {
        dataObject[key] = value;
    });

    console.log(dataObject, "aqui el actualizar señores"); // Imprime el objeto con los datos del formulario

    return {
        id_proveedor:dataObject.rutProveedorx,
        nombreIdentficiador: dataObject.nombreIdentificadorx,
        nombreFantasia: dataObject.nombreFantasianombreFantasiax,
        rut_soporte: dataObject.rutSoporte,
        giro: dataObject.giroProveedorx,
        nombreRepresentanteLegal: dataObject.nombreRepresentantex,
        rutRepresentante: dataObject.rutRepresentantex,
        razonSocial: dataObject.razonSocialx,
        direccion: dataObject.direccionx,
        id_medios: dataObject.id_medios,
        id_region: dataObject.id_regionx,
        id_comuna: dataObject.id_comunax,
        telCelular: dataObject.telCelularx,
        telFijo: dataObject.telFijox,
        email: dataObject.emailx || null,
        bonificacion_ano: dataObject.bonificacion_anox,
        escala: dataObject.escala_rangox,
  
    };
}

// Función para enviar el formulario
async function submitForm3(event) {
    event.preventDefault(); // Evita la recarga de la página

    let bodyContent = JSON.stringify(getFormData4());
    console.log(bodyContent, "holacon");

    let idsopor = document.querySelector('input[name="rutProveedorx"]').value;

    let headersList = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
    };

    try {
        let response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Soportes?id_soporte=eq.${idsopor}`, {
            method: "PATCH",
            body: bodyContent,
            headers: headersList
        });

        if (response.ok) {
            alert("Actualización correcta");
            location.reload();
        } else {
            let errorData = await response.json();
            console.error("Error:", errorData);
            alert("Error, intentelo nuevamente");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de red, intentelo nuevamente");
    }
}

// Asigna el evento de envío al formulario de actualizar proveedor
document.getElementById('formularioactualizarSoporte').addEventListener('submit', submitForm3);
