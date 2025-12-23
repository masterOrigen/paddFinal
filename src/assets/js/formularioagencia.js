var currentTab = 0; // Current tab is set to be the first tab (0)
showTab(currentTab); // Display the current tab

function showTab(n) {
    // This function will display the specified tab of the form...
    var x = document.getElementsByClassName("tab2");
    x[n].style.display = "block";
    //... and fix the Previous/Next buttons:
    if (n == 0) {
        document.getElementById("prevBtn2").style.display = "none";
    } else {
        document.getElementById("prevBtn2").style.display = "inline";
    }
    if (n == (x.length - 1)) {
        document.getElementById("nextBtn2").innerHTML = "Registrar";
        document.getElementById("nextBtn2").setAttribute("onclick", "submitForm(event)");
    } else {
        document.getElementById("nextBtn2").innerHTML = "Siguiente";
        document.getElementById("nextBtn2").setAttribute("onclick", "nextPrev(1)");
    }
    //... and run a function that will display the correct step indicator:
    fixStepIndicator(n)
}

function nextPrev(n) {
    // This function will figure out which tab to display
    var x = document.getElementsByClassName("tab2");
    // Exit the function if any field in the current tab is invalid:
    if (n == 1 && !validateForm()) return false;
    // Hide the current tab:
    x[currentTab].style.display = "none";
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    // if you have reached the end of the form...
    if (currentTab >= x.length) {
        // ... the form gets submitted:
        document.getElementById("agenciaform").submit();
        return false;
    }
    // Otherwise, display the correct tab:
    showTab(currentTab);
}

function validateForm() {
    // This function deals with validation of the form fields
    var x, y, i, valid = true;
    x = document.getElementsByClassName("tab2");
    y = x[currentTab].getElementsByTagName("input");
    // A loop that checks every input field in the current tab:
    for (i = 0; i < y.length; i++) {
        // If a field is empty...
        if (y[i].value == "") {
            // add an "invalid" class to the field:
            y[i].className += " invalid";
            // and set the current valid status to false
            valid = false;
        }
    }
    // If the valid status is true, mark the step as finished and valid:
    if (valid) {
        document.getElementsByClassName("step")[currentTab].className += " finish";
    }
    return valid; // return the valid status
}

function fixStepIndicator(n) {
    // This function removes the "active" class of all steps...
    var i, x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" active", "");
    }
    //... and adds the "active" class on the current step:
    x[n].className += " active";
}

function getFormData() {
    const formData = new FormData(document.getElementById('agenciaform'));

    // Convertir FormData a objeto para imprimirlo
    const dataObject = {};
    formData.forEach((value, key) => {
        dataObject[key] = value;
    });

    console.log(dataObject, "hola"); // Imprime el objeto con los datos del formulario

    return {

        created_at: new Date().toISOString(),
        RazonSocial: dataObject.razonSocial,
        NombreDeFantasia: dataObject.nombreFantasia,
        RutAgencia: dataObject.rut,
        Giro: dataObject.giro,
        NombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
        Comuna: dataObject.id_comuna,
        Email: dataObject.email || null,
        estado: false,
        NombreIdentificador: dataObject.nombreIdentificador,
        telCelular: dataObject.telCelular,
        telFijo: dataObject.telFijo,
        Region: dataObject.id_region,
        DireccionAgencia: dataObject.direccionEmpresa,
        rutRepresentante: dataObject.rutRepresentante,
        
        
        
        
        
    };
}

// Función para enviar el formulario
async function submitForm(event) {
    event.preventDefault(); // Evita la recarga de la página

    let bodyContent = JSON.stringify(getFormData());
    console.log(bodyContent, "holacon");

    let headersList = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWp4emp3aHhvdHBkZnpjcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyNzEwOTMsImV4cCI6MjAzNTg0NzA5M30.Vh4XAp1X6eJlEtqNNzYIoIuTPEweat14VQc9-InHhXc"
    };

    let response = await fetch("https://ekyjxzjwhxotpdfzcpfq.supabase.co/rest/v1/Agencias", {
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    if (response.ok) {
        // Si el registro fue exitoso
        alert("Registro correcto");
    } else {
        // Si hubo un error en el registro
        const errorData = await response.json();
        console.error("Error:", errorData);
        alert("Error, intentelo nuevamente");
    }
}
