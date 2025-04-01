
document.getElementById('regionx').addEventListener('change', function () {
    var regionId = this.value;
    var comunaSelect = document.getElementById('comunax');
    var opcionesComunas = comunaSelect.querySelectorAll('option');

    // Mostrar solo las comunas que pertenecen a la región seleccionada
    opcionesComunas.forEach(function (opcion) {
        if (opcion.getAttribute('data-region') === regionId) {
            opcion.style.display = 'block';
        } else {
            opcion.style.display = 'none';
        }
    });

    // Seleccionar la primera opción visible
    var firstVisibleOption = comunaSelect.querySelector('option[data-region="' + regionId + '"]');
    if (firstVisibleOption) {
        firstVisibleOption.selected = true;
    }
});

// Disparar el evento change al cargar la página para establecer el estado inicial
document.getElementById('regionx').dispatchEvent(new Event('change'));



document.querySelectorAll('.region-select').forEach(function(regionSelect) {
    regionSelect.addEventListener('change', function () {
        var regionId = this.value;
        var comunaSelect = this.closest('form').querySelector('.comuna-select');
        var opcionesComunas = comunaSelect.querySelectorAll('option');

        // Mostrar solo las comunas que pertenecen a la región seleccionada
        opcionesComunas.forEach(function (opcion) {
            if (opcion.getAttribute('data-region') === regionId) {
                opcion.style.display = 'block';
            } else {
                opcion.style.display = 'none';
            }
        });

        // Seleccionar la primera opción visible
        var firstVisibleOption = comunaSelect.querySelector('option[data-region="' + regionId + '"]');
        if (firstVisibleOption) {
            firstVisibleOption.selected = true;
        }
    });

    // Disparar el evento change al cargar la página para establecer el estado inicial
    regionSelect.dispatchEvent(new Event('change'));
});