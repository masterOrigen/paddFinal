
function loadProveedorData(button) {
    var idProveedor = button.getAttribute('data-idproveedor');
    var proveedor = getProveedorData(idProveedor);
    var idMedios = JSON.parse(button.getAttribute('data-idmedios'));
    if (proveedor) {
        console.log('Datos del proveedor:', proveedor);
        document.querySelector('input[name="idprooo"]').value = proveedor.id_proveedor;
        document.querySelector('input[name="nombreIdentificadorp"]').value = proveedor.nombreIdentificador;
        document.querySelector('input[name="nombreProveedorp"]').value = proveedor.nombreProveedor;
        document.querySelector('input[name="nombreFantasiap"]').value = proveedor.nombreFantasia;
        document.querySelector('input[name="rutProveedorp"]').value = proveedor.rutProveedor;
        document.querySelector('input[name="giroProveedorp"]').value = proveedor.giroProveedor;
        document.querySelector('input[name="nombreRepresentantep"]').value = proveedor.nombreRepresentante;
        document.querySelector('input[name="rutRepresentantep"]').value = proveedor.rutRepresentante;
        document.querySelector('input[name="razonSocialp"]').value = proveedor.razonSocial;
        document.querySelector('input[name="direccionFacturacionp"]').value = proveedor.direccionFacturacion;
        document.querySelector('select[name="id_regionp"]').value = proveedor.id_region;
        document.querySelector('select[name="id_comunap"]').value = proveedor.id_comuna;
        document.querySelector('input[name="telCelularp"]').value = proveedor.telCelular;
        document.querySelector('input[name="telFijop"]').value = proveedor.telFijo;
        document.querySelector('input[name="emailp"]').value = proveedor.email;
        document.querySelector('input[name="bonificacion_anop"]').value = proveedor.bonificacion_ano;
        document.querySelector('input[name="escala_rangop"]').value = proveedor.escala_rango;
        if (idMedios && Array.isArray(idMedios)) {
            // Concatenar los idMedios en una cadena separada por comas
            var idMediosString = idMedios.join(',');
            document.querySelector('input[name="idmedios"]').value = idMediosString;
            updateMediosDropdown(idMedios);
        }
    
    } else {
        console.log("No se encontró el proveedor con ID:", idProveedor);
    }
}





function getFormData3() {
    const formData = new FormData(document.getElementById('formactualizarproveedor'));

    // Convertir FormData a objeto para imprimirlo
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
        nombreIdentificador: dataObject.nombreIdentificadorp,
        nombreProveedor: dataObject.nombreProveedorp,
        nombreFantasia: dataObject.nombreFantasiap,
        rutProveedor: dataObject.rutProveedorp,
        giroProveedor: dataObject.giroProveedorp,
        nombreRepresentante: dataObject.nombreRepresentantep,
        rutRepresentante: dataObject.rutRepresentantep,
        razonSocial: dataObject.razonSocialp,
        direccionFacturacion: dataObject.direccionFacturacionp,
        id_medios: dataObject['id_medios[]'],
        id_region: dataObject.id_regionp,
        id_comuna: dataObject.id_comunap,
        telCelular: dataObject.telCelularp,
        telFijo: dataObject.telFijop,
        email: dataObject.emailp || null,
        bonificacion_ano: dataObject.bonificacion_anop,
        escala_rango: dataObject.escala_rangop,
    };
}

// Función para enviar el formulario
async function submitForm3(event) {
    event.preventDefault(); // Evita la recarga de la página

    const formData = getFormData3();
    const idProveedor = document.querySelector('input[name="idprooo"]').value;

    const proveedorData = {
        nombreIdentificador: formData.nombreIdentificador,
        nombreProveedor: formData.nombreProveedor,
        nombreFantasia: formData.nombreFantasia,
        rutProveedor: formData.rutProveedor,
        giroProveedor: formData.giroProveedor,
        nombreRepresentante: formData.nombreRepresentante,
        rutRepresentante: formData.rutRepresentante,
        razonSocial: formData.razonSocial,
        direccionFacturacion: formData.direccionFacturacion,
        id_region: formData.id_region,
        id_comuna: formData.id_comuna,
        telCelular: formData.telCelular,
        telFijo: formData.telFijo,
        email: formData.email || null,
        bonificacion_ano: formData.bonificacion_ano,
        escala_rango: formData.escala_rango,
    };


    const headersList = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
    };

    try {
        // Actualizar el proveedor
        const response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Proveedores?id_proveedor=eq.${idProveedor}`, {
            method: "PATCH",
            body: JSON.stringify(proveedorData),
            headers: headersList
        });
    
        if (response.ok) {
            // Eliminar registros antiguos de proveedor_medios asociados al id_proveedor
            const deleteResponse = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/proveedor_medios?id_proveedor=eq.${idProveedor}`, {
                method: "DELETE",
                headers: headersList
            });
    
            if (deleteResponse.ok) {
                // Verificar si hay id_medios para registrar
                if (Array.isArray(formData.id_medios) && formData.id_medios.length > 0) {
                    const proveedorMediosData = formData.id_medios.map(id_medio => ({
                        id_proveedor: idProveedor,
                        id_medio: id_medio
                    }));
    
                    const insertResponse = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/proveedor_medios", {
                        method: "POST",
                        body: JSON.stringify(proveedorMediosData),
                        headers: headersList
                    });
    
                    if (insertResponse.ok) {
                        mostrarExito('Actualización correcta');
                    } else {
                        const errorData = await insertResponse.text();
                        console.error("Error en proveedor_medios:", errorData);
                        alert("Error al registrar los medios, intente nuevamente");
                    }
                } else {
                    mostrarExito('Actualización correcta');
                }
    
                $('#actualizarProveedor').modal('hide');
                $('#formactualizarproveedor')[0].reset();
          
                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'Actualización correcta',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                // Mostrar el GIF de carga
                showLoading();
                location.reload();
            } else {
                const errorData = await deleteResponse.text();
                console.error("Error al eliminar proveedor_medios:", errorData);
                alert("Error al eliminar los medios antiguos, intente nuevamente");
            }
        } else {
            const errorData = await response.json();
            console.error("Error:", errorData);
            alert("Error al actualizar el proveedor, intente nuevamente");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de red, intentelo nuevamente");
    }
}

// Función para enviar el formulario
async function submitForm4(event) {
    event.preventDefault(); // Evita la recarga de la página

    const formData = getFormProgra();
    const idProgramas = document.querySelector('input[name="idProgramas"]').value;

    const programaData = {
        nombreIdentificador: formData.nombreIdentificador,
        codigo_programa: formData.codigo_programa,
        descripcion: formData.descripcion,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        cod_prog_megatime: formData.cod_prog_megatime,
        estado: formData.estado,
    };


    const headersList = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
    };

    try {
        // Actualizar el proveedor
        const response = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Programas?id=eq.${idProgramas}`, {
            method: "PATCH",
            body: JSON.stringify(programaData),
            headers: headersList
        });
    
        if (response.ok) {
            // Eliminar registros antiguos de proveedor_medios asociados al id_proveedor
            const deleteResponse = await fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/programa_medios?id_programa=eq.${idProgramas}`, {
                method: "DELETE",
                headers: headersList
            });
    
            if (deleteResponse.ok) {
                // Verificar si hay id_medios para registrar
                if (Array.isArray(formData.id_medios) && formData.id_medios.length > 0) {
                    const proveedorMediosData = formData.id_medios.map(id_medio => ({
                        id_programa: idProgramas,
                        id_medios: id_medio
                    }));
    
                    const insertResponse = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/programa_medios", {
                        method: "POST",
                        body: JSON.stringify(proveedorMediosData),
                        headers: headersList
                    });
    
                    if (insertResponse.ok) {
                        mostrarExito('Actualización correcta');
                    } else {
                        const errorData = await insertResponse.text();
                        console.error("Error en proveedor_medios:", errorData);
                        alert("Error al registrar los medios, intente nuevamente");
                    }
                } else {
                    mostrarExito('Actualización correcta');
                }
    
                $('#actualizarPrograma').modal('hide');
                $('#formactualizarPrograma')[0].reset();
          
                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'Actualización correcta',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                // Mostrar el GIF de carga
                showLoading();
                location.reload();
            } else {
                const errorData = await deleteResponse.text();
                console.error("Error al eliminar proveedor_medios:", errorData);
                alert("Error al eliminar los medios antiguos, intente nuevamente");
            }
        } else {
            const errorData = await response.json();
            console.error("Error:", errorData);
            alert("Error al actualizar el proveedor, intente nuevamente");
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
document.getElementById('formactualizarproveedor').addEventListener('submit', submitForm3);
document.getElementById('formactualizarPrograma').addEventListener('submit', submitForm4);