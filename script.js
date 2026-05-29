// --- LÓGICA DE PROCESAMIENTO NUMÉRICO ---
let miGrafica = null;

// Ejecución automática inicial
window.onload = function() {
    resolver();
};

// Interactividad de la Guía Teórica (Intercambio de pestañas)
function cambiarTeoria(metodoKey, vista, botonPresionado) {
    document.getElementById(`${metodoKey}-formula`).style.display = 'none';
    document.getElementById(`${metodoKey}-def`).style.display = 'none';
    
    document.getElementById(`${metodoKey}-${vista}`).style.display = 'block';
    
    const contenedorBotones = botonPresionado.parentElement;
    const botones = contenedorBotones.getElementsByClassName('btn-teoria');
    for (let i = 0; i < botones.length; i++) {
        botones[i].classList.remove('active');
    }
    
    botonPresionado.classList.add('active');
}

// Control del menú desplegable de ejemplos
function toggleEjemplos(event) {
    if (event) event.stopPropagation();
    const despliegue = document.getElementById("desplegable-ejemplos");
    despliegue.classList.toggle("mostrar");
}

function cargarEjemplo(funcion, x0, metodo) {
    document.getElementById('funcion').value = funcion;
    document.getElementById('x0').value = x0;
    document.getElementById('metodo').value = metodo;
    document.getElementById('derivada1').value = '';
    document.getElementById('derivada2').value = '';
    
    document.getElementById("desplegable-ejemplos").classList.remove("mostrar");
    resolver();
}

// Cerrar menú si se hace clic afuera
window.onclick = function(event) {
    if (!event.target.matches('.btn-nav')) {
        const dropdowns = document.getElementsByClassName("dropdown-contenido");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('mostrar')) {
                dropdowns[i].classList.remove('mostrar');
            }
        }
    }
}

// ALGORITMO PRINCIPAL
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
        // Cálculo de derivadas automáticas si están vacías
        if (!d1Texto) { 
            d1Texto = math.derivative(funcionTexto, 'x').toString(); 
            document.getElementById('derivada1').value = d1Texto;
        }
        if (!d2Texto && metodo === "modificado") { 
            d2Texto = math.derivative(d1Texto, 'x').toString(); 
            document.getElementById('derivada2').value = d2Texto;
        }

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
                alert("La derivada colapsó a cero en x = " + xn);
                break;
            }

            if (metodo === "newton") {
                xn = xn - (current_fx / current_fdx);
            } else {
                let current_fddx = f_der2.evaluate({x: xn});
                let denominador = Math.pow(current_fdx, 2) - (current_fx * current_fddx);
                if (Math.abs(denominador) < 1e-14) {
                    alert("El denominador del método modificado colapsó a cero.");
                    break;
                }
                xn = xn - (current_fx * current_fdx) / denominador;
            }

            iter++;
            error = xn !== 0 ? Math.abs((xn - x_anterior) / xn) : Math.abs(xn - x_anterior);
            iteraciones.push({ iter: iter, x: xn, fx: f.evaluate({x: xn}), error: error });
        }

        // MOSTRAR CONTENEDOR DE RESULTADOS
        const contenedorRes = document.getElementById('contenedor-resultados');
        if (contenedorRes) {
            contenedorRes.style.display = 'block';
        }

        // Renderizar componentes
        actualizarResultadosHtml(iteraciones, digitos, metodo);
        actualizarTablaHtml(iteraciones, digitos);
        generarGraficaConTangente(funcionTexto, d1Texto, x0, xn);

    } catch (err) {
        alert("Error de sintaxis matemática. Usa operadores explícitos (ej: 3*x en lugar de 3x).");
        console.error(err);
    }
}

function actualizarResultadosHtml(iteraciones, digitos, metodo) {
    const resDiv = document.getElementById('resultado');
    const ultima = iteraciones[iteraciones.length - 1];
    resDiv.innerHTML = `
        <h2>Reporte Analítico</h2>
        <p style="margin-bottom: 6px;">• <strong>Algoritmo:</strong> ${metodo === 'newton' ? 'Newton-Raphson Clásico' : 'Newton-Raphson Modificado'}</p>
        <p style="margin-bottom: 6px;">• Aproximación de la Raíz: <strong style="color: #60a5fa; font-size: 1.1rem;">${ultima.x.toFixed(digitos)}</strong></p>
        <p style="margin-bottom: 6px;">• Iteraciones requeridas: <strong>${ultima.iter}</strong></p>
        <p>• Tolerancia Residual f(x): <code style="color: #f59e0b;">${ultima.fx.toExponential(4)}</code></p>
    `;
}

function actualizarTablaHtml(iteraciones, digitos) {
    const tbody = document.querySelector('#tabla tbody');
    tbody.innerHTML = "";
    iteraciones.forEach(i => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${i.iter}</strong></td>
            <td>${i.x.toFixed(digitos)}</td>
            <td>${i.fx.toExponential(4)}</td>
            <td>${i.error ? i.error.toExponential(4) : '— (Inicio)'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Generador de la curva f(x) e interpretación geométrica
function generarGraficaConTangente(funcionTxt, derivadaTxt, x_inicial, raiz) {
    const canvas = document.getElementById('grafica');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (miGrafica) { miGrafica.destroy(); }

    const expr_f = math.compile(funcionTxt);
    const expr_df = math.compile(derivadaTxt);

    const rangoX = Math.max(Math.abs(x_inicial - raiz) * 2.2, 3.0);
    const minX = raiz - rangoX;
    const maxX = raiz + rangoX;
    
    const labels = [];
    const valoresF = [];
    const valoresTangente = [];

    const f_x0 = expr_f.evaluate({x: x_inicial});
    const df_x0 = expr_df.evaluate({x: x_inicial});
    const pasos = 50;
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
                { label: 'f(x) Curva', data: valoresF, borderColor: '#3b82f6', borderWidth: 2.5, pointRadius: 0, fill: false },
                { label: 'Tangente en x0', data: valoresTangente, borderColor: '#f59e0b', borderWidth: 1.5, borderDash: [5, 5], pointRadius: 0, fill: false },
                { 
                    label: 'Raíz', 
                    data: labels.map(l => Math.abs(parseFloat(l) - raiz) < (delta * 0.95) ? expr_f.evaluate({x: raiz}) : null), 
                    pointRadius: 7, pointBackgroundColor: '#ef4444', borderColor: '#fff', borderWidth: 2, showLine: false 
                }
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