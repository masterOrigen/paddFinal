// Asegurarse de que este código se ejecute solo una vez
(function() {
    if (window.hasRun) return;
    window.hasRun = true;

    const SUPABASE_URL = 'https://ekyjxzjwhxotpdfzcpfq.supabase.co';
    const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc';

    // Función para obtener los datos del formulario
    function getFormData() {
        const form = document.getElementById('form-edit-contrato');
        const formData = new FormData(form);
        const dataObject = {};
        formData.forEach((value, key) => {
            if (key === 'Estado') {
                dataObject[key] = value === "1";
            } else if (['id', 'IdCliente', 'IdProveedor', 'id_FormadePago','id_Anio', 'IdTipoDePublicidad', 'id_GeneraracionOrdenTipo', 'num_contrato'].includes(key)) {
                dataObject[key] = value !== "" ? parseInt(value, 10) : null;
            } else if (['ValorNeto', 'ValorBruto', 'Descuento1', 'ValorTotal'].includes(key)) {
                dataObject[key] = value !== "" ? parseFloat(value) : null;
            } else if (key === 'idProducto') {
                dataObject['nombreProducto'] = value;
            } else {
                dataObject[key] = value;
            }
        });
        console.log('Datos del formulario:', dataObject);
        return dataObject;
    }

    // Función para validar el formulario
    function validateForm() {
        const fechaInicio = new Date(document.getElementById('editFechaInicio').value);
        const fechaTermino = new Date(document.getElementById('editFechaTermino').value);
        
        if (fechaTermino < fechaInicio) {
            Swal.fire({
                title: 'Error',
                text: 'La fecha de término no puede ser anterior a la fecha de inicio',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return false;
        }


        return true;
    }

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

    // Función para enviar el formulario con PATCH
    async function submitForm(event) {
        event.preventDefault();
        if (!validateForm()) return;

        const formData = getFormData();
        const contratoId = formData.id;
        if (!contratoId) {
            await Swal.fire({
                title: 'Error',
                text: 'No se pudo identificar el ID del contrato. Por favor, inténtelo nuevamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        delete formData.id;

        // Eliminar propiedades con valor null o undefined
        Object.keys(formData).forEach(key => 
            (formData[key] === null || formData[key] === undefined) && delete formData[key]
        );

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/Contratos?id=eq.${contratoId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                let modal = bootstrap.Modal.getInstance(document.getElementById('modalEditContrato'));
                modal.hide();
                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'El contrato se ha actualizado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
                // Mostrar la pantalla de carga
                showLoading();
                
                // Recargar la página
                window.location.reload();
            } else {
                const errorData = await response.json();
                console.error("Error:", errorData);
                await Swal.fire({
                    title: 'Error',
                    text: 'Ha ocurrido un error al actualizar el contrato. Por favor, inténtelo nuevamente.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error("Error:", error);
            await Swal.fire({
                title: 'Error',
                text: 'Ha ocurrido un error inesperado. Por favor, inténtelo nuevamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Función para cargar los datos del contrato en el formulario
    async function loadContratoData(contratoId) {
        console.log('Cargando contrato con ID:', contratoId);
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/Contratos?id=eq.${contratoId}&select=*`, {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener los datos del contrato');
            const data = await response.json();
            if (data.length === 0) throw new Error('No se encontró el contrato');
            
            const contrato = data[0];
            console.log('Datos del contrato:', contrato);

            // Llenar el formulario con los datos del contrato
            document.getElementById('editIdContrato').value = contrato.id;
            document.getElementById('editNombreContrato').value = contrato.NombreContrato || '';
            document.getElementById('editIdCliente').value = contrato.IdCliente || '';
            document.getElementById('editIdProveedor').value = contrato.IdProveedor || '';
            document.getElementById('editIdMedios').value = contrato.IdMedios || '';
            document.getElementById('editIdFormaDePago').value = contrato.id_FormadePago || '';
            document.getElementById('editFechaInicio').value = contrato.FechaInicio || '';
            document.getElementById('editFechaTermino').value = contrato.FechaTermino || '';
            document.getElementById('editIdTipoDePublicidad').value = contrato.IdTipoDePublicidad || '';
            document.getElementById('editIdGeneracionOrdenTipo').value = contrato.id_GeneraracionOrdenTipo || '';
            document.getElementById('editObservaciones').value = contrato.Observaciones || '';
            document.getElementById('editEstado').value = contrato.Estado ? '1' : '0';
            document.getElementById('editNumContrato').value = contrato.num_contrato || '';

            // Cargar productos del cliente
            await cargarProductoCliente(contrato.IdCliente);
            document.getElementById('editIdProducto').value = contrato.nombreProducto || '';

            // Cargar medios del proveedor
            await filtrarMediosProveedor(contrato.IdProveedor);
        } catch (error) {
            console.error('Error al cargar los datos del contrato:', error);
            await Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los datos del contrato. Por favor, inténtelo nuevamente.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Función para cargar productos de un cliente
    async function cargarProductoCliente(idCliente) {
        const selectProducto = document.getElementById('editIdProducto');
        selectProducto.innerHTML = '<option value="">Cargando productos del cliente...</option>';

        if (!idCliente) {
            selectProducto.innerHTML = '<option value="">Seleccione un cliente primero</option>';
            return;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/Productos?Id_Cliente=eq.${idCliente}&select=*`, {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            });
            if (!response.ok) throw new Error('Error al obtener los productos');
            const productos = await response.json();
            
            selectProducto.innerHTML = '';
            if (productos.length > 0) {
                productos.forEach(producto => {
                    const option = document.createElement('option');
                    option.value = producto.NombreDelProducto;
                    option.textContent = producto.NombreDelProducto;
                    selectProducto.appendChild(option);
                });
            } else {
                selectProducto.innerHTML = '<option value="">No hay productos para este cliente</option>';
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            selectProducto.innerHTML = '<option value="">Error al cargar productos</option>';
        }
    }

    // Función para filtrar medios de un proveedor
    async function filtrarMediosProveedor(idProveedor) {
        const selectMedio = document.getElementById('editIdMedios');
        selectMedio.innerHTML = '<option value="">Cargando medios del proveedor...</option>';
        selectMedio.disabled = true;

        if (!idProveedor) {
            selectMedio.innerHTML = '<option value="">Seleccione un proveedor primero</option>';
            selectMedio.disabled = false;
            return;
        }

        try {
            const responseRelaciones = await fetch(`${SUPABASE_URL}/rest/v1/proveedor_medios?id_proveedor=eq.${idProveedor}&select=id_medio`, {
                headers: {
                    'apikey': SUPABASE_API_KEY,
                    'Authorization': `Bearer ${SUPABASE_API_KEY}`
                }
            });
            if (!responseRelaciones.ok) throw new Error('Error al obtener las relaciones proveedor-medio');
            const relaciones = await responseRelaciones.json();

            if (relaciones.length > 0) {
                const idMedios = relaciones.map(rel => rel.id_medio);
                const responseMedios = await fetch(`${SUPABASE_URL}/rest/v1/Medios?id=in.(${idMedios.join(',')})&select=*`, {
                    headers: {
                        'apikey': SUPABASE_API_KEY,
                        'Authorization': `Bearer ${SUPABASE_API_KEY}`
                    }
                });
                if (!responseMedios.ok) throw new Error('Error al obtener los medios');
                const medios = await responseMedios.json();

                selectMedio.innerHTML = '';
                medios.forEach(medio => {
                    const option = document.createElement('option');
                    option.value = medio.id;
                    option.textContent = medio.NombredelMedio;
                    selectMedio.appendChild(option);
                });
            } else {
                selectMedio.innerHTML = '<option value="">No hay medios disponibles para este proveedor</option>';
            }
        } catch (error) {
            console.error('Error al cargar medios:', error);
            selectMedio.innerHTML = '<option value="">Error al cargar medios</option>';
        } finally {
            selectMedio.disabled = false;
        }
    }
    // Función para calcular el Valor Bruto y Total (continuación)
    function calcularValores() {
        const valorNeto = parseFloat(document.getElementById('editValorNeto').value) || 0;
        const valorBruto = Math.round(valorNeto * 1.19);
        const descuento = parseFloat(document.getElementById('editDescuento1').value) || 0;
        const valorTotal = Math.max(0, valorBruto - descuento);

        document.getElementById('editValorBruto').value = valorBruto;
        document.getElementById('editValorTotal').value = valorTotal;
    }

    // Función para obtener el siguiente número de contrato
    function getNextContractNumber() {
        fetch(`${SUPABASE_URL}/rest/v1/Contratos?select=num_contrato&order=num_contrato.desc&limit=1`, {
            headers: {
                "apikey": SUPABASE_API_KEY,
                "Authorization": `Bearer ${SUPABASE_API_KEY}`
            }
        })
        .then(response => response.json())
        .then(data => {
            let nextNumber = 1;
            if (data.length > 0 && data[0].num_contrato) {
                nextNumber = parseInt(data[0].num_contrato) + 1;
            }
            document.getElementById('editNumContrato').value = nextNumber;
        })
        .catch(error => {
            console.error("Error al obtener el siguiente número de contrato:", error);
            document.getElementById('editNumContrato').value = 1; // Valor por defecto en caso de error
        });
    }

    // Inicializar los manejadores de eventos cuando se abre el modal
    const modal = document.getElementById('modalEditContrato');
    if (modal) {
        modal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const contratoId = button.getAttribute('data-contrato-id');
            console.log('ID del contrato a editar:', contratoId);
            loadContratoData(contratoId);
        });
    }

    // Agregar el event listener al botón de editar contrato
    const btnEditContrato = document.getElementById('btn-edit-contrato');
    if (btnEditContrato) {
        btnEditContrato.addEventListener('click', submitForm);
    }

    // Agregar event listeners para el cálculo automático
    document.getElementById('editValorNeto').addEventListener('input', calcularValores);
    document.getElementById('editDescuento1').addEventListener('input', calcularValores);

    // Event listener para cargar productos cuando cambia el cliente
    const selectCliente = document.getElementById('editIdCliente');
    if (selectCliente) {
        selectCliente.addEventListener('change', function() {
            cargarProductoCliente(this.value);
        });
    }

    // Event listener para filtrar medios cuando cambia el proveedor
    const selectProveedor = document.getElementById('editIdProveedor');
    if (selectProveedor) {
        selectProveedor.addEventListener('change', function() {
            filtrarMediosProveedor(this.value);
        });
    }

    // Llamar a getNextContractNumber cuando se abre el modal de edición
    // (solo si el campo está vacío, para no sobrescribir contratos existentes)
    modal.addEventListener('show.bs.modal', function () {
        const numContratoField = document.getElementById('editNumContrato');
        if (!numContratoField.value) {
            getNextContractNumber();
        }
    });

    // Agregar un event listener para cuando la página haya terminado de cargar
    window.addEventListener('load', function() {
        hideLoading();
    });

})();
