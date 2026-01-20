import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

async function deleteClient(event) {
    event.preventDefault();
    const clientId = event.currentTarget.getAttribute('data-id');
    
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar!',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/Clientes?id_cliente=eq.${clientId}`, {
                method: 'DELETE',
                headers: {
                    "apikey": SUPABASE_API_KEY,
                    "Authorization": `Bearer ${SUPABASE_API_KEY}`
                }
            });

            if (response.ok) {
                Swal.fire(
                    'Eliminado!',
                    'El cliente ha sido eliminado.',
                    'success'
                );
                updateTable();
            } else {
                throw new Error('Error al eliminar el cliente');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire(
                'Error!',
                'Hubo un problema al eliminar el cliente.',
                'error'
            );
        }
    }
}

async function updateTable() {
    try {
        let response = await fetch('ListClientes.php', { 
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (response.ok) {
            let html = await response.text();
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            let newTableBody = tempDiv.querySelector('#table-1 tbody');
            if (newTableBody) {
                let currentTable = document.querySelector('#table-1');
                if (currentTable) {
                    let currentTableBody = currentTable.querySelector('tbody');
                    if (currentTableBody) {
                        currentTableBody.innerHTML = newTableBody.innerHTML;
                    }
                }
            }
            addDeleteEventListeners();
        } else {
            console.error("Error al actualizar la tabla");
        }
    } catch (error) {
        console.error("Error al actualizar la tabla:", error);
    }
}

function addDeleteEventListeners() {
    document.querySelectorAll('.delete-client').forEach(button => {
        button.removeEventListener('click', deleteClient);
        button.addEventListener('click', deleteClient);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    addDeleteEventListeners();
});
