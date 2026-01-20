import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

async function getLastProveedorId() {
    const headersList = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/Proveedores?select=id_proveedor&order=id_proveedor.desc&limit=1`, {
            method: "GET",
            headers: headersList
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                return parseInt(data[0].id_proveedor);
            }
            return 0; // Si no hay proveedores, empezamos desde 0
        } else {
            console.error("Error al obtener el último ID:", await response.text());
            return 0;
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        return 0;
    }
}

async function getFormData() {
    const form = document.getElementById('formualarioSoporte');
    const formData = new FormData(form);
    const dataObject = Object.fromEntries(formData);

    console.log(dataObject, "Datos del formulario");

    const lastId = await getLastProveedorId();
    const newId = lastId + 1;

    return {
        id_proveedor: newId,
        created_at: new Date().toISOString(),
        ...dataObject,
        estado: true
    };
}

async function submitForm(event) {
    event.preventDefault();

    const formData = await getFormData();
    const bodyContent = JSON.stringify(formData);
    console.log(bodyContent, "Datos a enviar");

    const headersList = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`,
        "Prefer": "return=representation"
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/Proveedores`, {
            method: "POST",
            body: bodyContent,
            headers: headersList
        });

        console.log(response, "Respuesta");

        if (response.ok) {
            const proveedorData = await response.json();
            console.log("Proveedor registrado correctamente:", proveedorData);

            const soporteData = {
                created_at: new Date().toISOString(),
                id_proveedor: proveedorData[0].id_proveedor,
                nombre_soporte: formData.nombreIdentificador
            };

            const soporteResponse = await fetch(`${SUPABASE_URL}/rest/v1/Soportes`, {
                method: "POST",
                body: JSON.stringify(soporteData),
                headers: headersList
            });

            if (soporteResponse.ok) {
                mostrarExito('¡Soporte agregado exitosamente!');
                $('#agregarSoportessss').modal('hide');
                window.location.href = `ListProveedores.php?expandir=${proveedorData[0].id_proveedor}&nuevoSoporte=${nuevoSoporte[0].id_soporte}`;
            } else {
                const errorText = await soporteResponse.text();
                console.error("Error en el registro de soporte:", errorText);
                alert("Error en el registro de soporte, inténtelo nuevamente");
            }
        } else {
            const errorText = await response.text();
            console.error("Error en el registro de proveedor:", errorText);
            alert("Error en el registro de proveedor, inténtelo nuevamente");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión, inténtelo nuevamente");
    }
}
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        showConfirmButton: false,
        timer: 1500
    });
}
async function actualizarTablaSoportes(idProveedor) {
    try {
        const response = await fetch(`get_soportes.php?proveedor_id=${idProveedor}`);
        const soportes = await response.json();
        
        // Obtener los datos del proveedor (puedes ajustar esto según cómo almacenes los datos del proveedor)
        const proveedorRow = document.querySelector(`tr[data-proveedor-id="${idProveedor}"]`);
        const proveedor = {
            razonSocial: proveedorRow.dataset.razonSocial,
            nombreFantasia: proveedorRow.dataset.nombreFantasia,
            rutProveedor: proveedorRow.dataset.rutProveedor,
            giroProveedor: proveedorRow.dataset.giroProveedor,
            nombreRepresentante: proveedorRow.dataset.nombreRepresentante,
            rutRepresentante: proveedorRow.dataset.rutRepresentante,
            direccionFacturacion: proveedorRow.dataset.direccionFacturacion,
            id_region: proveedorRow.dataset.idRegion,
            id_comuna: proveedorRow.dataset.idComuna,
            telCelular: proveedorRow.dataset.telCelular,
            telFijo: proveedorRow.dataset.telFijo,
            email: proveedorRow.dataset.email,
            id_proveedor: idProveedor
        };

        const table = $('#tableExportadora').DataTable();
        const row = table.row(`tr[data-proveedor-id="${idProveedor}"]`);
        
        if (row.child.isShown()) {
            // Si la fila está expandida, actualizamos su contenido
            row.child(formatSoportes(soportes, proveedor)).show();
        }

        // Actualizamos el contador de soportes en la fila del proveedor
        const countCell = proveedorRow.querySelector('td:nth-child(7)');
        if (countCell) {
            countCell.textContent = soportes.length;
        }
    } catch (error) {
        console.error("Error al actualizar la tabla de soportes:", error);
    }
}

document.getElementById('formualarioSoporte').addEventListener('submit', submitForm);
