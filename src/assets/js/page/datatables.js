"use strict";

$("[data-checkboxes]").each(function () {
  var me = $(this),
    group = me.data('checkboxes'),
    role = me.data('checkbox-role');

  me.change(function () {
    var all = $('[data-checkboxes="' + group + '"]:not([data-checkbox-role="dad"])'),
      checked = $('[data-checkboxes="' + group + '"]:not([data-checkbox-role="dad"]):checked'),
      dad = $('[data-checkboxes="' + group + '"][data-checkbox-role="dad"]'),
      total = all.length,
      checked_length = checked.length;

    if (role == 'dad') {
      if (me.is(':checked')) {
        all.prop('checked', true);
      } else {
        all.prop('checked', false);
      }
    } else {
      if (checked_length >= total) {
        dad.prop('checked', true);
      } else {
        dad.prop('checked', false);
      }
    }
  });
});

$("#table-1").dataTable({
  "columnDefs": [
    { "sortable": false, "targets": [2, 3] }
  ]
});
$("#table-2").dataTable({
  "columnDefs": [
    { "sortable": false, "targets": [0, 2, 3] }
  ],
  order: [[1, "asc"]] //column indexes is zero based

});
$('#save-stage').DataTable({
  "scrollX": true,
  stateSave: true
});
$('#tableExport').DataTable({
  dom: 'Bfrtip',
  buttons: [
    'csv', 'excel'
  ]
});

$('#tableBuscar').DataTable({
  language: {
    url: '//cdn.datatables.net/plug-ins/2.1.3/i18n/es-MX.json',
  }
});
$('#tableExportadora-simplificada').DataTable({
  language: {
    url: '//cdn.datatables.net/plug-ins/2.1.3/i18n/es-MX.json',
  }

});

$('#tableExportadora').DataTable({

  language: {
    url: '//cdn.datatables.net/plug-ins/2.1.3/i18n/es-MX.json',
  },
 
  columnDefs: [
    {
      targets: -1, // Última columna
      visible: true,
      searchable: false,
      printable: false,
      ordering: true
    }
  ],
  searching: false // Oculta la barra de búsqueda de la tabla
}

);

$('.btn-export-excel').addClass('disabled');
