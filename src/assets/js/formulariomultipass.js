import { supabaseUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_API_KEY } from '../../config/supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    var Fn = {
        validaRut: function(rutCompleto) {
            if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rutCompleto)) return false;
            var tmp = rutCompleto.split('-');
            var digv = tmp[1];
            var rut = tmp[0];
            if (digv == 'K') digv = 'k';
            return (Fn.dv(rut) == digv);
        },
        dv: function(T) {
            var M = 0, S = 1;
            for (; T; T = Math.floor(T / 10)) S = (S + T % 10 * (9 - M++ % 6)) % 11;
            return S ? S - 1 : 'k';
        }
    };

    // Validación en tiempo real para RUTs
    var rutInputs = document.querySelectorAll('input[name="RUT"], input[name="Rut_representante"]');
    rutInputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var errorMessage = document.getElementById(this.name === "RUT" ? "RUT-error" : "Rut_representante-error");
            
            if (this.value === "") {
                this.classList.remove("invalid");
                errorMessage.classList.remove("active");
            } else if (!Fn.validaRut(this.value)) {
                this.classList.add("invalid");
                errorMessage.classList.add("active");
            } else {
                this.classList.remove("invalid");
                errorMessage.classList.remove("active");
            }
        });
    });

    // Validación en tiempo real para Email
    var emailInput = document.getElementsByName('email')[0];
    var emailErrorMessage = document.getElementById('email-error');

    emailInput.addEventListener('input', function() {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value === "") {
            this.classList.remove("invalid");
            emailErrorMessage.classList.remove("active");
        } else if (!emailPattern.test(this.value)) {
            this.classList.add("invalid");
            emailErrorMessage.classList.add("active");
        } else {
            this.classList.remove("invalid");
            emailErrorMessage.classList.remove("active");
        }
    });

    // Funciones para el manejo de tabs y formulario
    var currentTab = 0;
    showTab(currentTab);

    function showTab(n) {
        var x = document.getElementsByClassName("tab");
        x[n].style.display = "block";
        
        var prevBtn = document.getElementById("prevBtn");
        var nextBtn = document.getElementById("nextBtn");
        
        prevBtn.style.display = n == 0 ? "none" : "inline";
        prevBtn.onclick = function() { nextPrev(-1); };
        
        if (n == (x.length - 1)) {
            nextBtn.innerHTML = "Registrar";
            nextBtn.onclick = submitForm;
        } else {
            nextBtn.innerHTML = "Siguiente";
            nextBtn.onclick = function() { nextPrev(1); };
        }
        
        fixStepIndicator(n);
    }

    function nextPrev(n) {
        var x = document.getElementsByClassName("tab");
        if (n == 1 && !validateForm()) return false;
        x[currentTab].style.display = "none";
        currentTab += n;
        if (currentTab < 0) {
            currentTab = 0;
        }
        if (currentTab >= x.length) {
            document.getElementById("regForm").submit();
            return false;
        }
        showTab(currentTab);
    }

    function validateForm() {
        var x, y, i, valid = true;
        x = document.getElementsByClassName("tab");
        y = x[currentTab].getElementsByTagName("input");
        
        for (i = 0; i < y.length; i++) {
            if (y[i].value == "") {
                y[i].className += " invalid";
                valid = false;
            }
        }
        
        if (currentTab == 0) {
            var rutInput = document.getElementsByName("RUT")[0];
            var rutRepresentanteInput = document.getElementsByName("Rut_representante")[0];
            
            if (!Fn.validaRut(rutInput.value)) {
                alert("RUT de empresa inválido");
                rutInput.className += " invalid";
                valid = false;
            }
            
            if (!Fn.validaRut(rutRepresentanteInput.value)) {
                alert("RUT de representante inválido");
                rutRepresentanteInput.className += " invalid";
                valid = false;
            }
        }
        
        if (valid) {
            document.getElementsByClassName("step")[currentTab].className += " finish";
        }
        return valid;
    }

    function fixStepIndicator(n) {
        var x = document.getElementsByClassName("step");
        for (var i = 0; i < x.length; i++) {
            x[i].className = x[i].className.replace(" active", "");
        }
        x[n].className += " active";
    }

    async function submitForm(event) {
        event.preventDefault();

        if (!validateForm()) {
            alert("Por favor, complete todos los campos correctamente antes de enviar.");
            return;
        }

        let bodyContent = JSON.stringify(getFormData());
        console.log(bodyContent, "Datos a enviar");

        let headersList = {
            "Content-Type": "application/json",
            "apikey": SUPABASE_API_KEY,
            "Authorization": `Bearer ${SUPABASE_API_KEY}`
        };

        try {
            let response = await fetch(`${SUPABASE_URL}/rest/v1/Clientes`, {
                method: "POST",
                body: bodyContent,
                headers: headersList
            });

            if (response.ok) {
                alert("Registro correcto");
                document.getElementById("regForm").reset();
                currentTab = 0;
                showTab(currentTab);
            } else {
                const errorData = await response.json();
                console.error("Error:", errorData);
                alert("Error, inténtelo nuevamente");
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            alert("Error de conexión, inténtelo más tarde");
        }
    }

    function getFormData() {
        const formData = new FormData(document.getElementById('regForm'));
        const dataObject = Object.fromEntries(formData);
        console.log(dataObject, "Datos del formulario");

        return {
            created_at: new Date().toISOString(),
            nombreCliente: dataObject.nombreCliente,
            nombreFantasia: dataObject.nombreFantasia,
            razonSocial: dataObject.razonSocial,
            id_tipoCliente: dataObject.id_tipoCliente,
            grupo: dataObject.grupo,
            RUT: dataObject.RUT,
            giro: dataObject.giro,
            nombreRepresentanteLegal: dataObject.nombreRepresentanteLegal,
            RUT_representante: dataObject.Rut_representante,
            direccionEmpresa: dataObject.direccionEmpresa,
            id_region: dataObject.id_region,
            id_comuna: dataObject.id_comuna,
            telCelular: dataObject.telCelular,
            telFijo: dataObject.telFijo,
            estado: false,
            email: dataObject.email || null
        };
    }
});