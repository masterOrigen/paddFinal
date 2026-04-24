function setupDropdown(dropdownId) {
    const dropdown = document.querySelector(`#${dropdownId}`);
    
    if (!dropdown) {
        console.error(`Dropdown with ID ${dropdownId} not found.`);
        return;
    }

    const dropdownButton = dropdown.querySelector('.dropdown-button');
    const dropdownContent = dropdown.querySelector('.dropdown-content');
    const selectedOptionsContainer = dropdown.querySelector('.selected-options');
    const sellElement = dropdown.querySelector('.sell');

    // Manejador de evento para mostrar/ocultar el contenido del dropdown
    function toggleDropdown() {
        dropdown.classList.toggle('open');
        dropdownContent.style.display = dropdown.classList.contains('open') ? 'grid' : 'none';
    }

    // Mostrar el dropdown al hacer clic en el contenedor de opciones seleccionadas
    selectedOptionsContainer.addEventListener('click', function(event) {
        event.stopPropagation();
        toggleDropdown();
    });

    // Mostrar el dropdown al hacer clic en el botón
    dropdownButton.addEventListener('click', function(event) {
        event.stopPropagation();
        toggleDropdown();
    });

    // Cerrar el dropdown al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove('open');
            dropdownContent.style.display = 'none';
        }
    });

    // Manejador para actualizar las opciones seleccionadas
    dropdown.querySelectorAll('.dropdown-content input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function(event) {
            event.stopPropagation();
            updateSelectedOptions();
        });
    });

    // Función para actualizar el contenedor de opciones seleccionadas
    function updateSelectedOptions() {
        selectedOptionsContainer.innerHTML = ''; // Limpia las opciones seleccionadas

        const selectedCheckboxes = dropdown.querySelectorAll('.dropdown-content input[type="checkbox"]:checked');
        if (selectedCheckboxes.length > 0) {
            dropdownButton.style.display = 'none';
            sellElement.style.display = 'none';
            selectedOptionsContainer.style.display = 'flex'; // Mostrar el contenedor si hay opciones seleccionadas
        } else {
            dropdownButton.style.display = 'block';
            sellElement.style.display = 'block';
            selectedOptionsContainer.style.display = 'none'; // Ocultar el contenedor si no hay opciones seleccionadas
        }

        selectedCheckboxes.forEach(checkbox => {
            const label = checkbox.parentElement.textContent.trim();
            const selectedOption = document.createElement('span');
            selectedOption.className = 'selected-option';
            selectedOption.textContent = label;
            selectedOption.dataset.value = checkbox.value;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'x';
            removeButton.addEventListener('click', function(event) {
                event.stopPropagation();
                checkbox.checked = false;
                updateSelectedOptions();
            });

            selectedOption.appendChild(removeButton);
            selectedOptionsContainer.appendChild(selectedOption);
        });
    }

    // Actualizar la vista de las opciones seleccionadas en la inicialización
    updateSelectedOptions();
}

// Inicializa los dropdowns

['dropdown5', 'dropdown6', 'dropdown1', 'dropdown2', 'dropdown3', 'dropdown4', 'dropdown7'].forEach(id => setupDropdown(id));



function updateMediosDropdown(idMedios) {
    const dropdowns = document.querySelectorAll('.dropdown-medios');
    if (!dropdowns.length) {
        console.error('No se encontraron dropdowns.');
        return;
    }

    dropdowns.forEach(dropdown => {
        const checkboxes = dropdown.querySelectorAll('.dropdown-content input[type="checkbox"]');
        const selectedOptionsContainer = dropdown.querySelector('.selected-options');
        const sellContainer = dropdown.querySelector('.sell');
        const dropdownButton = dropdown.querySelector('.dropdown-button');

        // Limpiar el contenedor de opciones seleccionadas
        selectedOptionsContainer.innerHTML = '';

        let hasSelectedOptions = false;

        checkboxes.forEach(checkbox => {
            if (idMedios.includes(parseInt(checkbox.value))) {
                checkbox.checked = true;

                // Obtener el texto del medio asociado al checkbox
                const medioLabel = checkbox.closest('label').textContent.trim();

                // Crear un nuevo elemento <span> para la opción seleccionada
                const selectedOption = document.createElement('span');
                selectedOption.className = 'selected-option';
                selectedOption.setAttribute('data-value', checkbox.value);

                // Establecer el contenido del <span> con el nombre del medio
                selectedOption.innerHTML = `${medioLabel}<button>x</button>`;

                // Agregar el <span> al contenedor de opciones seleccionadas
                selectedOptionsContainer.appendChild(selectedOption);

                // Marcar que hay al menos una opción seleccionada
                hasSelectedOptions = true;

                // Agregar un event listener al botón de eliminar
                selectedOption.querySelector('button').addEventListener('click', function() {
                    // Desmarcar el checkbox correspondiente
                    checkbox.checked = false;

                    // Eliminar el <span> del contenedor
                    selectedOptionsContainer.removeChild(selectedOption);

                    // Verificar si hay alguna opción seleccionada
                    if (selectedOptionsContainer.children.length === 0) {
                        selectedOptionsContainer.style.display = 'none';
                        sellContainer.style.display = 'block';
                        dropdownButton.style.display = 'block';
                    }
                });
            } else {
                checkbox.checked = false;
            }
        });

        // Mostrar u ocultar elementos según si hay opciones seleccionadas
        if (hasSelectedOptions) {
            selectedOptionsContainer.style.display = 'flex';
            sellContainer.style.display = 'none';
            dropdownButton.style.display = 'none';
        } else {
            selectedOptionsContainer.style.display = 'none';
            sellContainer.style.display = 'block';
            dropdownButton.style.display = 'block';
        }
    });
}


