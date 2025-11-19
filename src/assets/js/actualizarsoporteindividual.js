function loadProveedorDataSoporte(button) {
    var idSoporte = button.getAttribute('data-id-soporte');
    var soporte = getSoporteData(idSoporte);
    var idMedios = JSON.parse(button.getAttribute('data-idmedios'));
    if (soporte) {
        console.log('Datos del soporte:', soporte);
        console.log(soporte.nombreIdentficiador,"Holaa");
        document.querySelector('input[name="idSoporteHidden"]').value = idSoporte;
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
        if (idMedios && Array.isArray(idMedios)) {
            // Concatenar los idMedios en una cadena separada por comas
            var idMediosString = idMedios.join(',');
            document.querySelector('input[name="idmedios"]').value = idMediosString;
            updateMediosDropdown(idMedios);
        }
       
    } else {
        console.log("No se encontró el proveedor con ID:", idSoporte);
    }
}

function getFormData4() {
    const formData = new FormData(document.getElementById('formularioactualizarSoporte'));

    // Convertir FormData a objeto para facilitar la manipulación
    const dataObject = {};
    formData.forEach((value, key) => {
        if (key === 'id_medios[]') {
            if (!dataObject[key]) {
                dataObject[key] = [];
            }
            dataObject[key].push(value);
        } else {
            dataObject[key] = value;
        }
    });

    console.log(dataObject, "aqui el actualizar señores"); // Imprime el objeto con los datos del formulario

    return {
        id_proveedor: dataObject.rutProveedorx,
        nombreIdentficiador: dataObject.nombreIdentificadorx,
        nombreFantasia: dataObject.nombreFantasianombreFantasiax,
        rut_soporte: dataObject.rutSoporte,
        giro: dataObject.giroProveedorx,
        nombreRepresentanteLegal: dataObject.nombreRepresentantex,
        rutRepresentante: dataObject.rutRepresentantex,
        razonSocial: dataObject.razonSocialx,
        direccion: dataObject.direccionx,
        id_medios: dataObject['id_medios[]'],
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

    const formData = getFormData4();
    const idSoporte = document.querySelector('input[name="idSoporteHidden"]').value;

    const headersList = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
    };

    try {
        // Actualizar el soporte
        const response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Soportes?id_soporte=eq.${idSoporte}`, {
            method: "PATCH",
            body: JSON.stringify({
                id_proveedor: formData.id_proveedor,
                nombreIdentficiador: formData.nombreIdentficiador,
                nombreFantasia: formData.nombreFantasia,
                rut_soporte: formData.rut_soporte,
                giro: formData.giro,
                nombreRepresentanteLegal: formData.nombreRepresentanteLegal,
                rutRepresentante: formData.rutRepresentante,
                razonSocial: formData.razonSocial,
                direccion: formData.direccion,
                id_region: formData.id_region,
                id_comuna: formData.id_comuna,
                telCelular: formData.telCelular,
                telFijo: formData.telFijo,
                email: formData.email,
                bonificacion_ano: formData.bonificacion_ano,
                escala: formData.escala,
            }),
            headers: headersList
        });
    
        if (response.ok) {
            // Eliminar registros antiguos de soporte_medios asociados al id_soporte
            const deleteResponse = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/soporte_medios?id_soporte=eq.${idSoporte}`, {
                method: "DELETE",
                headers: headersList
            });
    
            if (deleteResponse.ok) {
                // Verificar si hay id_medios para registrar
                if (Array.isArray(formData.id_medios) && formData.id_medios.length > 0) {
                    const soporteMediosData = formData.id_medios.map(id_medio => ({
                        id_soporte: idSoporte,
                        id_medio: id_medio
                    }));
    
                    const insertResponse = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/soporte_medios", {
                        method: "POST",
                        body: JSON.stringify(soporteMediosData),
                        headers: headersList
                    });
    
                    if (insertResponse.ok) {
                        mostrarExito('Soporte actualizado correctamente');
                    } else {
                        const errorData = await insertResponse.text();
                        console.error("Error en soporte_medios:", errorData);
                        alert("Error al registrar los medios, intente nuevamente");
                    }
                } else {
                    mostrarExito('Soporte actualizado correctamente');
                }
    
                $('#actualizarSoporte').modal('hide');
                $('#formularioactualizarSoporte')[0].reset();
  
                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'Soporte actualizado correctamente',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                // Mostrar el GIF de carga
                showLoading();
                location.reload();
            } else {
                const errorData = await deleteResponse.text();
                console.error("Error al eliminar soporte_medios:", errorData);
                alert("Error al eliminar los medios antiguos, intente nuevamente");
            }
        } else {
            const errorData = await response.json();
            console.error("Error:", errorData);
            alert("Error al actualizar el soporte, intente nuevamente");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de red, intentelo nuevamente");
    }
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

async function mostrarExito(mensaje) {
    return new Promise((resolve) => {
        // Asumiendo que esta función muestra un mensaje y luego resuelve la promesa
        Swal.fire({
            title: '¡Éxito!',
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
            resolve(); // Resuelve la promesa cuando se cierra el Swal
        });
    });
}


// Asigna el evento de envío al formulario de actualizar proveedor
document.getElementById('formularioactualizarSoporte').addEventListener('submit', submitForm3);
