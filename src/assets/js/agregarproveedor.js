import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

// Función para obtener el último ID de proveedor y sumarle 1
async function obtenerNuevoIdProveedor() {
    try {
        let response = await fetch(`${SUPABASE_URL}/rest/v1/Proveedores?select=id_proveedor&order=id_proveedor.desc&limit=1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_API_KEY,
                "Authorization": `Bearer ${SUPABASE_API_KEY}`
            }
        });

        if (response.ok) {
            const proveedores = await response.json();
            const ultimoProveedor = proveedores[0];
            const nuevoIdProveedor = ultimoProveedor ? ultimoProveedor.id_proveedor + 1 : 1;
            return nuevoIdProveedor;
        } else {
            console.error("Error al obtener el último ID de proveedor:", await response.text());
            throw new Error("Error al obtener el último ID de proveedor");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        throw error;
    }
}
function getFormData2() {
    const formData2 = new FormData(document.getElementById('formularioAgregarProveedor'));
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
        nombreIdentificador: dataObject2.nombreIdentificador,
        nombreProveedor: dataObject2.nombreProveedor,
        nombreFantasia: dataObject2.nombreFantasia,
        rutProveedor: dataObject2.rutProveedor,
        giroProveedor: dataObject2.giroProveedor,
        nombreRepresentante: dataObject2.nombreRepresentante,
        rutRepresentante: dataObject2.rutRepresentante,
        razonSocial: dataObject2.razonSocial,
        direccionFacturacion: dataObject2.direccionFacturacion,
        id_medios: dataObject2['id_medios[]'], // Array of selected medios
        id_region: dataObject2.id_region,
        id_comuna: dataObject2.id_comuna,
        telCelular: dataObject2.telCelular,
        telFijo: dataObject2.telFijo,
        email: dataObject2.email || null,
        bonificacion_ano: dataObject2.bonificacion_ano,
        escala_rango: dataObject2.escala_rango,
        estado: true
    };
}

// Función para enviar el formulario de agregar proveedor y registrar medios
async function submitForm2(event) {
    event.preventDefault(); // Evita la recarga de la página

    const formData = getFormData2();
    const nuevoIdProveedor = await obtenerNuevoIdProveedor(); // Obtener el nuevo ID

    const proveedorData = {
        id_proveedor: nuevoIdProveedor, // Incluir el ID generado
        created_at: formData.created_at,
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
        email: formData.email,
        bonificacion_ano: formData.bonificacion_ano,
        escala_rango: formData.escala_rango,
        estado: formData.estado
    };

    try {
        // Registrar el proveedor
        let responseProveedor = await fetch(`${SUPABASE_URL}/rest/v1/Proveedores`, {
            method: "POST",
            body: JSON.stringify(proveedorData),
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_API_KEY,
                "Authorization": `Bearer ${SUPABASE_API_KEY}`
            }
        });
    
        if (responseProveedor.ok) {
            console.log("Proveedor registrado correctamente");
    
            // Continuar con el registro de medios si hay datos
            if (Array.isArray(formData.id_medios) && formData.id_medios.length > 0) {
                const proveedorMediosData = formData.id_medios.map(id_medio => ({
                    id_proveedor: nuevoIdProveedor, // Usar el ID generado
                    id_medio: id_medio
                }));
    
                let responseProveedorMedios = await fetch(`${SUPABASE_URL}/rest/v1/proveedor_medios`, {
                    method: "POST",
                    body: JSON.stringify(proveedorMediosData),
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": SUPABASE_API_KEY,
                        "Authorization": `Bearer ${SUPABASE_API_KEY}`
                    }
                });
    
                if (responseProveedorMedios.ok) {
                    mostrarExito('Proveedor y medios registrados correctamente');
                } else {
                    const errorData = await responseProveedorMedios.text();
                    console.error("Error en proveedor_medios:", errorData);
                    alert("Error al registrar los medios, intente nuevamente");
                }
            } else {
                // No hay medios para registrar, solo completa el proceso
                mostrarExito('Proveedor registrado correctamente');
            }
    
            $('#agregarProveedor').modal('hide');
            $('#formularioAgregarProveedor')[0].reset();

        
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
            console.error("Error en proveedor:", errorData);
            alert("Error al registrar el proveedor, intente nuevamente");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de red, intente nuevamente");
    }
}
function refreshTable() {
    fetch('/get_proveedores.php')
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
function populateTable(proveedores) {
    const tbody = document.getElementById('proveedores-tbody');
    tbody.innerHTML = ''; // Clear existing rows

    proveedores.forEach(proveedor => {
        const row = document.createElement('tr');
        row.className = 'proveedor-row';
        row.dataset.proveedorId = proveedor.id_proveedor;

        row.innerHTML = `
            <tr class="proveedor-row" data-proveedor-id="${proveedor.id_proveedor}">
            <td><i class="expand-icon fas fa-angle-right"></i></td>
            <td>${proveedor.id_proveedor}</td>
            <td>
            ${proveedor.medios.length > 0 ? 
                `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="dist_marketing-btn-icon__AWP8I" data-bs-toggle="tooltip" data-bs-html="true" title="Información sobre medios">
                    <path fill-rule="evenodd" d="" clip-rule="evenodd" d="M24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274" fill="currentColor"></path>
                </svg>${proveedor.medios.join(", ")} ` : 
                "No hay medios asociados"}
                </td>            
                <td>${proveedor.nombreProveedor}</td>
                    <td>${proveedor.razonSocial}</td>
                    <td>${proveedor.rutProveedor}</td>
                    <td>0</td>
                <td>
                    <div class="alineado">
                        <label class="custom-switch sino" data-toggle="tooltip" 
                        title="${proveedor.estado ? 'Desactivar Proveedor' : 'Activar Cliente'}">
                            <input type="checkbox" 
                                class="custom-switch-input estado-switch2"
                                data-id="${proveedor.id_proveedor}" data-tipo="proveedor" ${proveedor.estado ? 'checked' : ''}>
                            <span class="custom-switch-indicator"></span>
                        </label>
                    </div>
                </td>

           <td>
                <a class="btn btn-primary" href="views/viewProveedor.php?id_proveedor=${proveedor.id_proveedor}" data-toggle="tooltip" title="Ver Proveedor"><i class="fas fa-eye"></i></a>
                <a class="btn btn-success" data-bs-toggle="modal" data-bs-target="#actualizarProveedor" data-id-proveedor="${proveedor.id_proveedor}" onclick="loadProveedor(this)"><i class="fas fa-pencil-alt"></i></a>
            </td>
            </tr>
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


function agregarEventListeners() {
    document.querySelectorAll('.editar-comision').forEach(btn => {
        btn.onclick = (e) => cargarDatosComision(e.currentTarget.dataset.id);
    });
    document.querySelectorAll('.eliminar-comision').forEach(btn => {
        btn.onclick = (e) => eliminarComision(e.currentTarget.dataset.id);
    });
}



// Asigna el evento de envío al formulario de agregar proveedor
document.getElementById('formularioAgregarProveedor').addEventListener('submit', submitForm2);
