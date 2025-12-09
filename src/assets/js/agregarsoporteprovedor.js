
document.addEventListener('DOMContentLoaded', function () {
    $('#agregarsoporteprov').on('shown.bs.modal', function (event) {
        var button = $(event.relatedTarget);
        var idProveedor = button.data('id-proveedor');
        console.log("ID Proveedor:", idProveedor);

        var inputPrueba = document.getElementById('pruebaid');
        inputPrueba.value = idProveedor;

        // Realizar la petición para obtener todos los soportes vinculados al proveedor actual
        fetch(`https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/proveedor_soporte?select=id_soporte&id_proveedor=eq.${idProveedor}`, {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc',
            }
        })
        .then(response => response.json())
        .then(proveedor_soportes => {
            let vinculados_str = '';
            if (proveedor_soportes && proveedor_soportes.length > 0) {
                const vinculados = proveedor_soportes.map(soporte => soporte.id_soporte);
                vinculados_str = vinculados.filter(id => id).join(','); // Filtrar valores vacíos
            } 

            // Realizar la petición para obtener soportes no vinculados o todos los soportes si no hay vinculados
            const url = vinculados_str 
                ? `https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Soportes?id_soporte=not.in.(${vinculados_str})&select=*`
                : `https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Soportes?select=*`;

            return fetch(url, {
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc',
                }
            })
        })
        .then(response => response.json())
        .then(soportes_no_vinculados => {
            console.log(soportes_no_vinculados);

            var soporteSelect = document.getElementById('soporteSelect');
            soporteSelect.innerHTML = '';

            if (soportes_no_vinculados && soportes_no_vinculados.length > 0) {
                soportes_no_vinculados.forEach(function (soporte) {
                    var option = document.createElement('option');
                    option.value = soporte.id_soporte;
                    option.textContent = soporte.nombreIdentficiador;
                    soporteSelect.appendChild(option);
                });
            } else {
                var option = document.createElement('option');
                option.textContent = 'No se encontraron soportes vinculados';
                soporteSelect.appendChild(option); // Añadir la opción al select
            }
        })
        .catch(error => console.error("Error al obtener soportes:", error));
    });



    document.getElementById('formagregarsoporte3').addEventListener('submit', function (event) {
    event.preventDefault();

    var idProveedor = document.getElementsByName('pruebaid')[0].value;
    var idSoporte = document.getElementById('soporteSelect').value;

    if (!idProveedor || !idSoporte) {
        console.error("ID Proveedor o ID Soporte no válidos.");
        return;
    }

    fetch('https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/proveedor_soporte', {
        method: 'POST',
        headers: {
                    "Content-Type": "application/json",
                    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
                },
        body: JSON.stringify({
            id_proveedor: idProveedor,
            id_soporte: idSoporte
        })
    })
    .then(async response => {  // Convierte la función en async
        console.log('Código de estado:', response.status); // Imprime el código de estado
        
        const text = await response.text(); // Espera a que se complete la conversión a texto

        if (response.ok) {
            $('#agregarsoporteprov').modal('hide');
            
            // Espera a que se muestre el mensaje de éxito
            await mostrarExito('¡Soporte agregado correctamente!');
    
            // Mostrar el GIF de carga
            showLoading();
            location.reload();

            try {
                return JSON.parse(text); // Intenta parsear el texto como JSON
            } catch (error) {
                throw new Error('Respuesta no es JSON válido: ' + text);
            }
        } else {
            throw new Error(`Error ${response.status}: ${text}`);
        }
    })
    .then(data => {
        console.log("Soporte registrado exitosamente:", data);
        // Puedes mostrar un mensaje de éxito o cerrar el modal aquí
        $('#agregarsoporteprov').modal('hide');
    })
    .catch(error => {
        console.error("Error al registrar el soporte:", error.message);
        // Puedes mostrar un mensaje de error aquí
    });
});



});








async function obtenerNuevoIdSoporte() {
    try {
        let response = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Soportes?select=id_soporte&order=id_soporte.desc&limit=1", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
            }
        });

        if (response.ok) {
            const soportes = await response.json();
            const ultimoSoporte = soportes[0];
            const nuevoIdSoporte = ultimoSoporte ? ultimoSoporte.id_soporte + 1 : 1;
            return nuevoIdSoporte;
            console.log(nuevoIdSoporte,"ID SOPORTE");
        } else {
            console.error("Error al obtener el último ID de soporte:", await response.text());
            throw new Error("Error al obtener el último ID de soporte");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        throw error;
    }
}

function getFormDataSoporte() {
    const formData = new FormData(document.getElementById('formualarioSoporteProv'));
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
        ...dataObject,  // Retorna todos los valores de dataObject
        created_at: new Date().toISOString()
    };
}

async function submitFormSoporte2(event) {
    event.preventDefault(); // Evita la recarga de la página

    const formData = getFormDataSoporte();
    const nuevoIdSoporte = await obtenerNuevoIdSoporte(); // Obtener el nuevo ID
    const idProveedor = formData.id_proveedor; 
    console.log(idProveedor, "Holaaa");

    let soporteData;

    if (formData.revision === "on") {
        // Usar los datos del proveedor
        soporteData = {
            id_soporte: nuevoIdSoporte,
            created_at: formData.created_at,
            id_proveedor: formData.id_proveedor,
            nombreIdentficiador: formData.nombreIdentficiador,
            razonSocial: formData.razonsoculto,
            nombreFantasia: formData.nombref,
            rut_soporte: formData.rutt,
            giro: formData.giroo,
            nombreRepresentanteLegal: formData.nombreRepesentanteO,
            rutRepresentante: formData.rutRepresent,
            direccion: formData.direcciono,
            id_region: formData.regiono,
            id_comuna: formData.comunao,
            telCelular: formData.telCelularo,
            telFijo: formData.telFijoo,
            email: formData.emailO || null,
            bonificacion_ano: formData.bonificacion_ano,
            escala: formData.escala_rango
        };
    } else {
        // Usar los datos ingresados manualmente
        soporteData = {
            id_soporte: nuevoIdSoporte,
            created_at: formData.created_at,
            id_proveedor: formData.id_proveedor,
            nombreIdentficiador: formData.nombreIdentficiador,
            razonSocial: formData.razonSocial,
            nombreFantasia: formData.nombreFantasia,
            rut_soporte: formData.rut_soporte,
            giro: formData.giro,
            nombreRepresentanteLegal: formData.nombreRepresentanteLegal,
            rutRepresentante: formData.rutRepresentante,
            direccion: formData.direccion,
            id_region: formData.id_region,
            id_comuna: formData.id_comuna,
            telCelular: formData.telCelular,
            telFijo: formData.telFijo,
            email: formData.email || null,
            bonificacion_ano: formData.bonificacion_ano,
            escala: formData.escala_rango
        };
    }

    try {
        // Registrar el soporte
        let responseSoporte = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Soportes", {
            method: "POST",
            body: JSON.stringify(soporteData),
            headers: {
               "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
           }
        });

        if (responseSoporte.ok) {
            console.log("Soporte registrado correctamente");

            // Continuar con el registro de medios si existen
            if (formData['id_medios[]']) {
                const soporteMediosData = formData['id_medios[]'].map(id_medio => ({
                    id_soporte: nuevoIdSoporte, // Usar el ID generado
                    id_medio: id_medio
                }));

                if (soporteMediosData.length > 0) {
                    let responseSoporteMedios = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/soporte_medios", {
                        method: "POST",
                        body: JSON.stringify(soporteMediosData),
                        headers: {
                         "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
           }
                    });

                    if (!responseSoporteMedios.ok) {
                        const errorData = await responseSoporteMedios.text(); // Obtener respuesta como texto
                        console.error("Error en soporte_medios:", errorData);
                        alert("Error al registrar los medios, intente nuevamente");
                    }
                }
            }

            // Registrar en la tabla proveedor_soporte
            const soporteProveedor = {
                id_soporte: nuevoIdSoporte, // Usar el ID generado
                id_proveedor: formData.id_proveedor // Asegúrate de que formData contiene id_proveedor
            };

            let responseSoporteProveedor = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/proveedor_soporte", {
                method: "POST",
                body: JSON.stringify(soporteProveedor),
                headers: {
                  "Content-Type": "application/json",
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
           }
            });

            if (responseSoporteProveedor.ok) {
  
                $('#agregarSoportessss').modal('hide');
                $('#formualarioSoporteProv')[0].reset();
                await mostrarExito('¡Soporte agregado exitosamente!');
    
                // Mostrar el GIF de carga
                showLoading();
                location.reload();
            } else {
                const errorData = await responseSoporteProveedor.text(); // Obtener respuesta como texto
                console.error("Error en proveedor_soporte:", errorData);
                alert("Error al registrar el soporte-proveedor, intente nuevamente");
            }
        } else {
            const errorData = await responseSoporte.text(); // Obtener respuesta como texto
            console.error("Error en soporte:", errorData);
            alert("Error al registrar el soporte, intente nuevamente");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Ocurrió un error al intentar registrar el soporte. Intente nuevamente.");
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
                <a class="btn btn-success micono" data-idMedios="${soporte.medios.filter(medio => medio.id).map(medio => medio.id).join(',')}"  data-bs-toggle="modal" data-bs-target="#actualizarsoporte22" data-id-soporte="${soporte.id_soporte}" onclick="loadsoportepro(this)"><i class="fas fa-pencil-alt"></i></a>
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

// Asigna el evento de envío al formulario de agregar soporte
document.getElementById('formualarioSoporteProv').addEventListener('submit', submitFormSoporte2);


