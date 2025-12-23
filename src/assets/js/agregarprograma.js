async function obtenerNuevoIdProveedor() {
    try {
        let response = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Programas?select=id&order=id.desc&limit=1", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                     "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
            }
        });

        if (response.ok) {
            const proveedores = await response.json();
            const ultimoProveedor = proveedores[0];
            const nuevoIdProveedor = ultimoProveedor ? ultimoProveedor.id + 1 : 1;
            return nuevoIdProveedor;
        } else {
            console.error("Error al obtener el último ID de Programa:", await response.text());
            throw new Error("Error al obtener el último ID de Programa");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        throw error;
    }
}


function getFormData2() {
    const formData2 = new FormData(document.getElementById('formAgregarPrograma'));
    const dataObject2 = {};
    formData2.forEach((value, key) => {
        if (key === 'id_medios[]') {
            if (!dataObject2[key]) {
                dataObject2[key] = [];
            }
            dataObject2[key].push(value);
        } else {
            dataObject2[key] = value;
        }
    });

    return {
        created_at: new Date().toISOString(),
        codigo_programa: dataObject2.codigoPrograma,
        descripcion: dataObject2.decripcionp,
        hora_inicio: dataObject2.horaInicio,
        hora_fin: dataObject2.horaFin,
        cod_prog_megatime: dataObject2.decripcionp,
        id_medios: dataObject2['id_medios[]'],
        estado: true,
        soporte_id: dataObject2.idSoporteInput
    };
}

// Función para enviar el formulario de agregar proveedor y registrar medios
async function submitForm2(event) {
    event.preventDefault(); // Evita la recarga de la página

    const formData = getFormData2();
    const nuevoIdProveedor = await obtenerNuevoIdProveedor(); // Obtener el nuevo ID


    const proveedorData = {
        id: nuevoIdProveedor,
        created_at: formData.created_at,
        codigo_programa: formData.codigo_programa,
        descripcion: formData.descripcion,
        hora_inicio: formData.hora_inicio.toString(),
        hora_fin: formData.hora_fin.toString(),
        cod_prog_megatime: formData.cod_prog_megatime,
        soporte_id: formData.soporte_id,
        estado: formData.estado
    };
    console.log(formData, "aca2");
    console.log(proveedorData, "aca");
    try {
        // Registrar el proveedor
        let responseProveedor = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Programas", {
            method: "POST",
            body: JSON.stringify(proveedorData),
            headers: {
                "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
            }
        });
    
        if (responseProveedor.ok) {
            console.log("Programa registrado correctamente");
    
            // Continuar con el registro de medios si hay datos
            if (Array.isArray(formData.id_medios) && formData.id_medios.length > 0) {
                const proveedorMediosData = formData.id_medios.map(id_medio => ({
                    id_programa: nuevoIdProveedor, // Usar el ID generado
                    id_medios: id_medio
                }));
    
                let responseProveedorMedios = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/programa_medios", {
                    method: "POST",
                    body: JSON.stringify(proveedorMediosData),
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
                        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
                    }
                });
    
                if (responseProveedorMedios.ok) {
                    mostrarExito('Programa y medios registrados correctamente');
                } else {
                    const errorData = await responseProveedorMedios.text();
                    console.error("Error en proveedor_medios:", errorData);
                    alert("Error al registrar los medios, intente nuevamente");
                }
            } else {
                // No hay medios para registrar, solo completa el proceso
                mostrarExito('Programa registrado correctamente');
            }
    
            $('#agregarPrograma').modal('hide');
            $('#formAgregarPrograma')[0].reset();

        
            await Swal.fire({
                title: '¡Éxito!',
                text: 'Proveedor registrado correctamente',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            // Mostrar el GIF de carga
            showLoading();
            location.reload(); // Asegurarse de que la tabla se haya actualizado
        } else {
            const errorData = await responseProveedor.text();
            console.error("Error en programa:", errorData);
            alert("Error al registrar el programa, intente nuevamente");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de red, intente nuevamente");
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


function agregarEventListeners() {
    document.querySelectorAll('.editar-comision').forEach(btn => {
        btn.onclick = (e) => cargarDatosComision(e.currentTarget.dataset.id);
    });
    document.querySelectorAll('.eliminar-comision').forEach(btn => {
        btn.onclick = (e) => eliminarComision(e.currentTarget.dataset.id);
    });
}
function loadPrograma(button) {
    var idPrograma = button.getAttribute('data-idprograma');
    var idSoporte = button.getAttribute('data-id-soporte');
    var programa = getProgramaData(idPrograma);
    var idMedios2 = JSON.parse(button.getAttribute('data-idmedios2'));
    // Corrigiendo el uso de console.log
    console.log(programa, "msedios");
    console.log(idMedios2, "medios");
    if (programa) {
        document.querySelector('input[name="idProgramas"]').value = idPrograma;
        document.querySelector('input[name="idSoporteInput"]').value = idSoporte;
        document.querySelector('input[name="codigoProgramax"]').value = programa.codigo_programa;
        document.querySelector('input[name="horaIniciox"]').value = programa.hora_inicio;
        document.querySelector('input[name="horaFinx"]').value = programa.hora_fin;
        document.querySelector('input[name="decripcionpx"]').value = programa.descripcion;
        document.querySelector('input[name="codigomegatimeP"]').value = programa.cod_prog_megatime;
        if (idMedios2 && Array.isArray(idMedios2)) {
            var idMediosString2 = idMedios2.join(',');
            document.querySelector('input[name="idmedios2"]').value = idMediosString2;
            updateMediosDropdown(idMedios2);
        }
    
    } else {
        console.log("No se encontró el proveedor con ID:", idPrograma);
    }
}


function getFormProgra() {
    const formData = new FormData(document.getElementById('formactualizarPrograma'));

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
        codigo_programa: dataObject.codigoProgramax,
        descripcion: dataObject.decripcionpx,
        hora_inicio: dataObject.horaIniciox,
        hora_fin: dataObject.horaFinx,
        cod_prog_megatime: dataObject.codigomegatimeP,
        estado: '1',
        id_medios: dataObject['id_medios[]'],
        soporte_id: dataObject.idSoporteInput,
        programaid: dataObject.idProgramas,
        
    };
}


// Asigna el evento de envío al formulario de agregar proveedor
document.getElementById('formAgregarPrograma').addEventListener('submit', submitForm2);