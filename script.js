let grafica;

function resolver(){

    let metodo = document.getElementById("metodo").value;

    let funcion = document.getElementById("funcion").value;

    let derivada1 = document.getElementById("derivada1").value;

    let derivada2 = document.getElementById("derivada2").value;

    let x = parseFloat(document.getElementById("x0").value);

    let resultado = document.getElementById("resultado");

    let tabla = document.querySelector("#tabla tbody");

    tabla.innerHTML = "";

    let error = 100;

    let iteraciones = 0;

    // CREAR FUNCIONES REALES
    let f = new Function("x", "return " + funcion);

    let df = new Function("x", "return " + derivada1);

    let d2f = new Function("x", "return " + derivada2);

    while(error > 0.000001 && iteraciones < 100){

        let fx = f(x);

        let dfx = df(x);

        let xnuevo;

        // NEWTON-RAPHSON NORMAL
        if(metodo == "newton"){

            xnuevo = x - (fx / dfx);
        }

        // NEWTON-RAPHSON MODIFICADO
        else{

            let d2fx = d2f(x);

            xnuevo = x - ((fx * dfx) / ((dfx * dfx) - (fx * d2fx)));
        }

        error = Math.abs(xnuevo - x);

        // AGREGAR FILA A LA TABLA
        tabla.innerHTML += `
            <tr>
                <td>${iteraciones}</td>
                <td>${x.toFixed(8)}</td>
                <td>${error.toFixed(8)}</td>
            </tr>
        `;

        x = xnuevo;

        iteraciones++;
    }

    resultado.innerHTML = `
        <h2>Resultado Final</h2>

        <p><strong>Método:</strong> ${metodo}</p>

        <p><strong>Raíz Aproximada:</strong> ${x.toFixed(8)}</p>

        <p><strong>Error:</strong> ${error.toFixed(8)}</p>

        <p><strong>Iteraciones:</strong> ${iteraciones}</p>
    `;

    // GRAFICAR
    graficar(funcion);
}

function graficar(funcion){

    let valoresX = [];

    let valoresY = [];

    // CONVERTIR TEXTO A FUNCIÓN REAL
    let f = new Function("x", "return " + funcion);

    for(let i = -10; i <= 10; i += 0.2){

        valoresX.push(i);

        let y = f(i);

        valoresY.push(y);
    }

    let ctx = document.getElementById("grafica");

    // ELIMINAR GRÁFICA ANTERIOR
    if(grafica){
        grafica.destroy();
    }

    grafica = new Chart(ctx, {

        type: 'line',

        data: {

            labels: valoresX,

            datasets: [{

                label: 'f(x)',

                data: valoresY,

                borderColor: '#2563eb',

                backgroundColor: 'rgba(37,99,235,0.2)',

                borderWidth: 3,

                tension: 0.4,

                fill: true,

                pointRadius: 1
            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    labels: {
                        color: 'black'
                    }
                }
            },

            scales: {

                x: {

                    title: {
                        display: true,
                        text: 'x',
                        color: 'black'
                    },

                    ticks: {
                        color: 'black'
                    }
                },

                y: {

                    title: {
                        display: true,
                        text: 'f(x)',
                        color: 'black'
                    },

                    ticks: {
                        color: 'black'
                    }
                }
            }
        }
    });
}