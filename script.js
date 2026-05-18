let miGrafica;

// --- CONTROL DE APERTURA DEL MENÚ ---
function toggleEjemplos(event) {
    if (event) {
        event.stopPropagation(); // Evita el cierre inmediato por propagación
    }
    const despliegue = document.getElementById("desplegable-ejemplos");
    despliegue.classList.toggle("mostrar");
}

// Carga el ejercicio, cierra el panel e inicia el renderizado automático
function cargarEjemplo(funcion, x0, metodo) {
    document.getElementById('funcion').value = funcion;
    document.getElementById('x0').value = x0;
    document.getElementById('metodo').value = metodo;
    
    document.getElementById('derivada1').value = '';
    document.getElementById('derivada2').value = '';
    
    const despliegue = document.getElementById("desplegable-ejemplos");
    despliegue.classList.remove("mostrar");
    
    resolver(); // Ejecuta automáticamente el cálculo y dibuja la gráfica
}

window.onclick = function(event) {
    if (!event.target.matches('.btn-nav')) {
        const dropdowns = document.getElementsByClassName("dropdown-contenido");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('mostrar')) {
                openDropdown.classList.remove('mostrar');
            }
        }
    }
}

// --- PROCESAMIENTO NUMÉRICO ---
function resolver() {
    const metodo = document.getElementById('metodo').value;
    const funcionTexto = document.getElementById('funcion').value.trim();
    let d1Texto = document.getElementById('derivada1').value.trim();
    let d2Texto = document.getElementById('derivada2').value.trim();
    const x0Text = document.getElementById('x0').value;
    const digitos = parseInt(document.getElementById('decimales').value) || 6;

    if (!funcionTexto || x0Text === "") {
        alert("Por favor, introduce la función f(x) y el valor inicial x0.");
        return;
    }

    const x0 = parseFloat(x0Text);
    const tol = 1e-12;
    const maxIter = 50;
    let iter = 0;
    let error = 100;
    let xn = x0;
    let iteraciones = [];

    try {
        if (!d1Texto) { d1Texto = math.derivative(funcionTexto, 'x').toString(); }
        if (!d2Texto && metodo === "modificado") { d2Texto = math.derivative(d1Texto, 'x').toString(); }

        const f = math.compile(funcionTexto);
        const f_der1 = math.compile(d1Texto);
        const f_der2 = d2Texto ? math.compile(d2Texto) : null;

        let fx_init = f.evaluate({x: xn});
        iteraciones.push({ iter: 0, x: xn, fx: fx_init, error: null });

        while (error > tol && iter < maxIter) {
            let x_anterior = xn;
            let current_fx = f.evaluate({x: xn});
            let current_fdx = f_der1.evaluate({x: xn});

            if (Math.abs(current_fdx) < 1e-14) {
                alert("La derivada colapsó a cero.");
                break;
            }

            if (metodo === "newton") {
                xn = xn - (current_fx / current_fdx);
            } else {
                let current_fddx = f_der2.evaluate({x: xn});
                let denominador = Math.pow(current_fdx, 2) - (current_fx * current_fddx);
                xn = xn - (current_fx * current_fdx) / denominador;
            }

            iter++;
            error = Math.abs((xn - x_anterior) / xn);
            let next_fx = f.evaluate({x: xn});

            iteraciones.push({ iter: iter, x: xn, fx: next_fx, error: error });
        }

        actualizarResultadosHtml(iteraciones, digitos);
        actualizarTablaHtml(iteraciones, digitos);
        generarGraficaConTangente(funcionTexto, d1Texto, x0, xn);

    } catch (err) {
        alert("Error de sintaxis en la ecuación matemática.");
        console.error(err);
    }
}

function actualizarResultadosHtml(iteraciones, digitos) {
    const resDiv = document.getElementById('resultado');
    const ultima = iteraciones[iteraciones.length - 1];
    resDiv.innerHTML = `
        <h2>Reporte Analítico</h2>
        <p>• Raíz calculada exitosamente en el eje \(x\): <strong>${ultima.x.toFixed(digitos)}</strong></p>
        <p>• Convergencia alcanzada en <strong>${ultima.iter}</strong> aproximaciones.</p>
        <p>• Residual final \(f(x_n)\): <code>${ultima.fx.toExponential(4)}</code></p>
    `;
}

function actualizarTablaHtml(iteraciones, digitos) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = "";
    iteraciones.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i.iter}</td>
            <td>${i.x.toFixed(digitos)}</td>
            <td>${i.fx.toExponential(4)}</td>
            <td>${i.error ? i.error.toExponential(4) : '— (Inicio)'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function generarGraficaConTangente(funcionTxt, derivadaTxt, x_inicial, raiz) {
    const ctx = document.getElementById('grafica').getContext('2d');
    if (miGrafica) { miGrafica.destroy(); }

    const expr_f = math.compile(funcionTxt);
    const expr_df = math.compile(derivadaTxt);

    const rangoX = Math.max(Math.abs(x_inicial - raiz) * 1.5, 1.5);
    const minX = raiz - rangoX;
    const maxX = raiz + rangoX;
    
    const labels = [];
    const valoresF = [];
    const valoresTangente = [];

    const f_x0 = expr_f.evaluate({x: x_inicial});
    const df_x0 = expr_df.evaluate({x: x_inicial});

    const pasos = 40;
    const delta = (maxX - minX) / pasos;

    for (let i = 0; i <= pasos; i++) {
        let x_val = minX + (i * delta);
        labels.push(x_val.toFixed(2));
        valoresF.push(expr_f.evaluate({x: x_val}));
        valoresTangente.push(f_x0 + df_x0 * (x_val - x_inicial));
    }

    miGrafica = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'f(x) Curva Real', data: valoresF, borderColor: '#3b82f6', borderWidth: 2.5, pointRadius: 0, fill: false },
                { label: 'Recta Tangente Inicial (x0)', data: valoresTangente, borderColor: '#f59e0b', borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, fill: false },
                { label: 'Solución Encontrada', data: labels.map(l => Math.abs(parseFloat(l) - raiz) < (delta * 0.8) ? expr_f.evaluate({x: raiz}) : null), pointRadius: 7, pointBackgroundColor: '#ef4444', borderColor: '#fff', borderWidth: 2, showLine: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#f1f5f9' } } }
        }
    });
}