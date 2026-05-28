// --- VARIABLES GLOBALES ---
let miGrafica = null;

// Carga automática inicial al abrir la aplicación
window.onload = function() {
    resolver();
};

// --- CONTROL DE APERTURA DEL MENÚ (DROPDOWN) ---
function toggleEjemplos(event) {
    if (event) {
        event.stopPropagation();
    }
    const despliegue = document.getElementById("desplegable-ejemplos");
    despliegue.classList.toggle("mostrar");
}

function cargarEjemplo(funcion, x0, metodo) {
    document.getElementById('funcion').value = funcion;
    document.getElementById('x0').value = x0;
    document.getElementById('metodo').value = metodo;
    
    document.getElementById('derivada1').value = '';
    document.getElementById('derivada2').value = '';
    
    const despliegue = document.getElementById("desplegable-ejemplos");
    despliegue.classList.remove("mostrar");
    
    resolver();
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

// --- PROCESAMIENTO NUMÉRICO (NEWTON-RAPHSON) ---
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
                alert("La derivada se aproximó críticamente a cero en x = " + xn);
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

            let next_fx = f.evaluate({x: xn});
            iteraciones.push({ iter: iter, x: xn, fx: next_fx, error: error });
        }

        // Mostrar el bloque de resultados oculto
        document.getElementById('contenedor-resultados').style.display = 'block';

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
        <p>• <strong>Método seleccionado:</strong> ${metodo === 'newton' ? 'Newton-Raphson Estándar' : 'Newton-Raphson Modificado'}</p>
        <p>• Raíz calculada aproximada: <strong style="color: #60a5fa; font-size: 1.1rem;">${ultima.x.toFixed(digitos)}</strong></p>
        <p>• Convergencia completada en <strong>${ultima.iter}</strong> iteraciones.</p>
        <p>• Residual f(x_n): <code>${ultima.fx.toExponential(4)}</code></p>
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
            <td>${i.error ? i.error.toExponential(4) : '— (Punto Inicial)'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function generarGraficaConTangente(funcionTxt, derivadaTxt, x_inicial, raiz) {
    const ctx = document.getElementById('grafica').getContext('2d');
    if (miGrafica) { miGrafica.destroy(); }

    const expr_f = math.compile(funcionTxt);
    const expr_df = math.compile(derivadaTxt);

    const rangoX = Math.max(Math.abs(x_inicial - raiz) * 2.0, 3.0);
    const minX = raiz - rangoX;
    const maxX = raiz + rangoX;
    
    const labels = [];
    const valoresF = [];
    const valoresTangente = [];

    const f_x0 = expr_f.evaluate({x: x_inicial});
    const df_x0 = expr_df.evaluate({x: x_inicial});

    const pasos = 60;
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
                { 
                    label: 'f(x) Curva Real', 
                    data: valoresF, 
                    borderColor: '#3b82f6', 
                    borderWidth: 3, 
                    pointRadius: 0, 
                    fill: false 
                },
                { 
                    label: 'Recta Tangente Inicial (x0)', 
                    data: valoresTangente, 
                    borderColor: '#f59e0b', 
                    borderWidth: 1.5, 
                    borderDash: [5, 5], 
                    pointRadius: 0, 
                    fill: false 
                },
                { 
                    label: 'Raíz Encontrada', 
                    data: labels.map(l => Math.abs(parseFloat(l) - raiz) < (delta * 0.95) ? expr_f.evaluate({x: raiz}) : null), 
                    pointRadius: 8, 
                    pointBackgroundColor: '#ef4444', 
                    borderColor: '#fff', 
                    borderWidth: 2, 
                    showLine: false 
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#f1f5f9' } } }
        }
    });
}