import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    const btnAddContrato = document.getElementById('btn-add-contrato');
    const formAddContrato = document.getElementById('form-add-contrato');
    const selectCliente = document.getElementById('IdCliente');
    const selectProducto = document.getElementById('idProducto');
    const selectProveedor = document.getElementById('IdProveedor');
    const selectMedio = document.getElementById('IdMedios');

 // Función para mostrar la pantalla de carga
 function showLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '9999';

    const loadingImage = document.createElement('img');
    loadingImage.src = "/assets/img/loading.gif";
    loadingImage.alt = "Cargando...";
    loadingImage.style.width = '220px';
    loadingImage.style.height = '135px';

    loadingOverlay.appendChild(loadingImage);
    document.body.appendChild(loadingOverlay);
}

// Función para ocultar la pantalla de carga
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

if (btnAddContrato) {
    btnAddContrato.addEventListener('click', function(event) {
        event.preventDefault();
        if (formAddContrato.checkValidity()) {
            submitForm();
        } else {
            formAddContrato.reportValidity();
        }
    });
} else {
    console.error("Error: No se pudo encontrar el botón de añadir contrato");
}


    if (selectCliente) {
        selectCliente.addEventListener('change', function() {
            cargarProductoCliente(this.value);
        });
    }

    if (selectProveedor) {
        selectProveedor.addEventListener('change', function() {
            filtrarMediosProveedor(this.value);
        });
    }


    function cargarProductoCliente(idCliente) {
        if (!selectProducto) {
            console.error("Error: El elemento select de productos no está disponible");
            return;
        }
        selectProducto.innerHTML = '<option value="">Cargando productos del cliente...</option>';

        if (!idCliente) {
            selectProducto.innerHTML = '<option value="">Seleccione un cliente primero</option>';
            return;
        }

        fetch(`${SUPABASE_URL}/rest/v1/Productos?Id_Cliente=eq.${idCliente}&select=*`, {
            headers: {
                "apikey": SUPABASE_API_KEY,
                "Authorization": `Bearer ${SUPABASE_API_KEY}`
            }
        })
        .then(response => response.json())
        .then(productos => {
            selectProducto.innerHTML = '';

            if (productos.length > 0) {
                productos.forEach(producto => {
                    const option = document.createElement('option');
                    option.value = producto.NombreDelProducto;
                    option.textContent = producto.NombreDelProducto;
                    selectProducto.appendChild(option);
                });
                
                selectProducto.value = productos[0].NombreDelProducto;
                selectProducto.dispatchEvent(new Event('change'));
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "No hay productos para este cliente";
                selectProducto.appendChild(option);
            }
        })
        .catch(error => {
            console.error("Error al cargar productos:", error);
            selectProducto.innerHTML = '<option value="">Error al cargar productos</option>';
        });
    }

    function filtrarMediosProveedor(idProveedor) {
        if (!selectMedio) {
            console.error("Error: El elemento select de medios no está disponible");
            return;
        }
        
        selectMedio.innerHTML = '<option value="">Cargando medios del proveedor...</option>';
        selectMedio.disabled = true;

        if (!idProveedor) {
            selectMedio.innerHTML = '<option value="">Seleccione un proveedor primero</option>';
            selectMedio.disabled = false;
            return;
        }

        fetch(`${SUPABASE_URL}/rest/v1/proveedor_medios?id_proveedor=eq.${idProveedor}&select=id_medio`, {
            headers: {
                "apikey": SUPABASE_API_KEY,
                "Authorization": `Bearer ${SUPABASE_API_KEY}`
            }
        })
        .then(response => response.json())
        .then(relaciones => {
            if (relaciones.length > 0) {
                const idMedios = relaciones.map(rel => rel.id_medio);
                return fetch(`${SUPABASE_URL}/rest/v1/Medios?id=in.(${idMedios.join(',')})&select=*`, {
                    headers: {
                        "apikey": SUPABASE_API_KEY,
                        "Authorization": `Bearer ${SUPABASE_API_KEY}`
                    }
                });
            } else {
                throw new Error("No hay medios asociados a este proveedor");
            }
        })
        .then(response => response.json())
        .then(medios => {
            selectMedio.innerHTML = '';
            if (medios.length > 0) {
                medios.forEach(medio => {
                    const option = document.createElement('option');
                    option.value = medio.id; // Cambiado de NombredelMedio a id
                    option.textContent = medio.NombredelMedio;
                    selectMedio.appendChild(option);
                });
                selectMedio.value = medios[0].id; // Cambiado de NombredelMedio a id
                selectMedio.dispatchEvent(new Event('change'));
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "No hay medios disponibles para este proveedor";
                selectMedio.appendChild(option);
            }
            selectMedio.disabled = false;
        })
        .catch(error => {
            console.error("Error al cargar medios:", error);
            selectMedio.innerHTML = '<option value="">Error al cargar medios</option>';
            selectMedio.disabled = false;
        });
    }

    function getFormData() {
        const formData = new FormData(formAddContrato);
        const dataObject = {};
        formData.forEach((value, key) => {
            if (key === 'Estado') {
                dataObject[key] = value === "1";
            } else if (['IdCliente', 'IdProveedor', 'id_FormadePago', 'IdMedios', 'id_Mes', 'id_Anio', 'IdTipoDePublicidad', 'id_GeneraracionOrdenTipo', 'num_contrato'].includes(key)) {
                dataObject[key] = value !== "" ? parseInt(value, 10) : null;
            } else if (key === 'idProducto') {
                dataObject['nombreProducto'] = value;
            } else {
                dataObject[key] = value;
            }
        });
        return dataObject;
    }
    function submitForm() {
        let bodyContent = JSON.stringify(getFormData());
        console.log("Datos a enviar:", bodyContent);

        let headersList = {
            "Content-Type": "application/json",
            "apikey": SUPABASE_API_KEY,
            "Authorization": `Bearer ${SUPABASE_API_KEY}`,
            "Prefer": "return=representation"
        };

        fetch(`${SUPABASE_URL}/rest/v1/Contratos`, {
            method: "POST",
            body: bodyContent,
            headers: headersList
        })
        .then(response => {
            console.log("Status:", response.status);
            console.log("Status Text:", response.statusText);
            return response.text().then(text => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
                }
                return text;
            });
        })
        .then(data => {
            console.log("Respuesta del servidor:", data);
            if (data) {
                try {
                    let jsonData = JSON.parse(data);
                    console.log("Contrato agregado correctamente:", jsonData);
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'El contrato ha sido agregado correctamente.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            showLoading(); // Mostrar pantalla de carga antes de recargar
                            window.location.reload();
                        }
                    });
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAddContrato'));
                    modal.hide();
                } catch (e) {
                    console.error("Error al procesar la respuesta JSON:", e);
                    throw new Error(`Respuesta no válida: ${data}`);
                }
            } else {
                throw new Error("La respuesta del servidor está vacía");
            }
        })
        .catch(error => {
            console.error("Error al agregar el contrato:", error);
            Swal.fire({
                title: 'Error',
                text: `Hubo un problema al agregar el contrato: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
    }
      // Agregar un event listener para cuando la página haya terminado de cargar
      window.addEventListener('load', function() {
        hideLoading();
    });
});