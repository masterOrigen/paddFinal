import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

function loadsoportepro(button) {
    var idSoporte = button.getAttribute('data-id-soporte');
    var soporte = getSoporteData(idSoporte);
   
    if (soporte) {
        // Llenar los campos del modal con los datos del soporte
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

        // Encabezados necesarios para la solicitud fetch
        let headersList = {
            "Content-Type": "application/json",
            "apikey": SUPABASE_API_KEY,
            "Authorization": `Bearer ${SUPABASE_API_KEY}`
        };

        // Ahora, obtenemos los medios vinculados a este soporte
        fetch(`${SUPABASE_URL}/rest/v1/soporte_medios?select=*&id_soporte=eq.` + idSoporte, {
            method: "GET",
            headers: headersList
        })
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    // Extraer los id_medios del array de resultados
                    var idMedios = data.map(medio => medio.id_medio);
                    console.log(idMedios,"aca ctm");
                    if (idMedios && Array.isArray(idMedios)) {
                        // Concatenar los idMedios en una cadena separada por comas
                        var idMediosString = idMedios.join(',');
                        document.querySelector('input[name="idmedios"]').value = idMediosString;
                        updateMediosDropdown(idMedios);
                    
                    }
                } else {
                    console.log('No hay medios asociados a este soporte.');
                }
            })
            .catch(error => {
                console.error('Error al obtener los medios asociados:', error);
            });

    } else {
        console.log("No se encontró el proveedor con ID:", idSoporte);
    }
}


function getFormData4() {
    const formData = new FormData(document.getElementById('formularioactualizarSoporteProv'));

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

    return {
        id_proveedor: dataObject.rutProveedorx,
        nombreIdentficiador: dataObject.nombreIdentificadorx,
        nombreFantasia: dataObject.nombreFantasiax,
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
    const idSoporte = document.querySelector('input[name="rutProveedorx"]').value; // Verifica que 'rutProveedorx' esté correcto

    const soporteData = {
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
    };

    const headersList = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`
    };

    try {
        // Actualizar el soporte
        let response = await fetch(`${SUPABASE_URL}/rest/v1/Soportes?id_soporte=eq.${idSoporte}`, {
            method: "PATCH",
            body: JSON.stringify(soporteData),
            headers: headersList
        });
        console.log("Respuesta del servidor PATCH:", response);
        console.log(soporteData, "data soporte");
        console.log(idSoporte, "data soporte");
    
        if (response.ok) {
            // Eliminar registros antiguos de soporte_medios asociados al id_soporte
            const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/soporte_medios?id_soporte=eq.${idSoporte}`, {
                method: "DELETE",
                headers: headersList
            });
            console.log("Respuesta del servidor DELETE:", deleteResponse);
    
            if (deleteResponse.ok) {
                // Registrar los nuevos medios asociados si formData.id_medios no está vacío, indefinido o nulo
                if (formData.id_medios && formData.id_medios.length > 0) {
                    const soporteMediosData = formData.id_medios.map(id_medio => ({
                        id_soporte: idSoporte,
                        id_medio: id_medio
                    }));
    
                    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/soporte_medios`, {
                        method: "POST",
                        body: JSON.stringify(soporteMediosData),
                        headers: headersList
                    });
                    console.log("Respuesta del servidor POST:", insertResponse);
                    console.log(soporteMediosData, "data soporte");
    
                    if (insertResponse.ok) {
             
                        $('#actualizarsoporte22').modal('hide');
                        $('#formularioactualizarSoporteProv')[0].reset();
                        await Swal.fire({
                            title: '¡Éxito!',
                            text: 'Soporte actualizado correctamente',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        });
                        showLoading();
                        location.reload();
                    } else {
                        const errorData = await insertResponse.text();
                        console.error("Error en soporte_medios:", errorData);
                        alert("Error al registrar los medios, intente nuevamente");
                    }
                } else {
                    // Si no hay medios para registrar, simplemente mostrar éxito
                                     $('#actualizarsoporte22').modal('hide');
                                        $('#formularioactualizarSoporteProv')[0].reset();
                    // Mostrar el GIF de carga
       
                    await Swal.fire({
                        title: '¡Éxito!',
                        text: 'Actualización correcta',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                // Mostrar el GIF de carga
                showLoading();
                location.reload();
                }
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
function refreshTable(proveedorId) {
    if (proveedorId) {
        fetch(`/get_soportes.php?proveedor_id=${proveedorId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                populateTable(data); // Actualiza la tabla con los datos recibidos
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
}

function populateTable(soportes) {
    const tbody = document.getElementById('soportes-tbody');
    tbody.innerHTML = ''; // Clear existing rows

    soportes.forEach(soporte => {
        const row = document.createElement('tr');
        row.className = 'soporte-row';
        row.dataset.soporteId = soporte.id_soporte;

        row.innerHTML = `
            <td>${soporte.id_soporte}</td>
            <td>${soporte.nombreIdentficiador}</td>
            <td>${soporte.razonSocial}</td>
            <td>${soporte.medios.length > 0 ? soporte.medios.join(", ") : "No hay medios asociados"}</td>
            <td>
                <a class="btn btn-primary micono" href="viewSoporte.php?id_soporte=${soporte.id_soporte}" data-toggle="tooltip" title="Ver Soporte"><i class="fas fa-eye"></i></a> 
                    <a class="btn btn-success micono" data-idMedios="${soporte.medios.map(medio => medio.id).join(',')}"  data-bs-toggle="modal" data-bs-target="#actualizarsoporte22" data-id-soporte="${soporte.id_soporte}" data-idMedios="${soporte.medios.map(medio => medio.id).join(',')}" onclick="loadsoportepro(this)"><i class="fas fa-pencil-alt"></i></a>

            </td>
        `;
        tbody.appendChild(row);
    });
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
document.getElementById('formularioactualizarSoporteProv').addEventListener('submit', submitForm3);
