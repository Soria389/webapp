let mesActual = null;
let gastosActuales = [];
let categorias = [];

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', async function () {
    await cargarMeses();
    await cargarCategorias();
});

async function cargarMeses() {
    try {
        const response = await fetch('/api/meses');
        const meses = await response.json();
        const select = document.getElementById('mesSelect');
        select.innerHTML = '<option value="">Seleccionar mes...</option>';

        meses.forEach(mes => {
            const option = document.createElement('option');
            option.value = mes.id;
            option.textContent = mes.nombre_mes;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando meses:', error);
    }
}

async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        categorias = await response.json();
        console.log('✅ Categorías cargadas:', categorias.length);
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function cargarMes() {
    const mesId = document.getElementById('mesSelect').value;
    if (!mesId) return;

    try {
        console.log('🔄 Cargando mes:', mesId);
        mesActual = mesId;

        // 1. Cargar RESUMEN (ya funciona)
        const resumenRes = await fetch(`/api/resumen/${mesId}`);
        const resumen = await resumenRes.json();

        // 2. Cargar INGRESOS para mostrar en inputs
        const ingresosRes = await fetch(`/api/ingresos/${mesId}`);
        const ingresos = await ingresosRes.json();

        // 3. Cargar gastos
        await cargarGastosModerno();

        // 4. MOSTRAR DATOS EN DASHBOARD
        // Stats cards
        document.getElementById('ingresos-real').textContent =
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resumen.total_ingresos_real || 0);
        document.getElementById('gastos-real').textContent =
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resumen.total_gastos_real || 0);
        document.getElementById('saldo-real').textContent =
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resumen.saldo_real || 0);

        // Comparison card
        document.getElementById('ingresos-previsto').textContent =
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resumen.total_ingresos_previsto || 0);
        document.getElementById('gastos-previsto').textContent =
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resumen.total_gastos_previsto || 0);
        document.getElementById('saldo-previsto').textContent =
            new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(resumen.saldo_previsto || 0);

        // Objetivo de ahorro (20% de ingresos reales)
        const objetivoAhorro = (resumen.total_ingresos_real || 0) * 0.20;
        const progresoAhorro = objetivoAhorro > 0 ? Math.round(((resumen.saldo_real || 0) / objetivoAhorro) * 100) : 0;
        document.getElementById('progreso-ahorro').textContent = `${progresoAhorro}%`;

        // 5. LLENAR INPUTS DE INGRESOS con datos actuales
        const ingresoPrevisto = ingresos.find(i => i.tipo === 'previsto') || {};
        const ingresoReal = ingresos.find(i => i.tipo === 'real') || {};

        document.getElementById('ingreso-previsto').value = ingresoPrevisto.monto || '';
        document.getElementById('ingreso-real').value = ingresoReal.monto || '';

        // Mostrar secciones
        document.getElementById('statsGrid').style.display = 'grid';
        document.getElementById('comparisonCard').style.display = 'block';
        document.getElementById('incomePanel').style.display = 'block';
        document.getElementById('expensesSection').style.display = 'block';

        console.log('✅ Dashboard actualizado:', { ingresos, resumen });
    } catch (error) {
        console.error('❌ Error cargando mes:', error);
        alert('Error cargando datos. Revisa consola (F12)');
    }
}


async function cargarGastosModerno() {
    try {
        const response = await fetch(`/api/gastos/${mesActual}`);
        gastosActuales = await response.json();

        // Agrupar por bloque
        const bloques = {};
        categorias.forEach(cat => {
            if (!bloques[cat.bloque]) bloques[cat.bloque] = [];
            const gasto = gastosActuales.find(g => g.categoria_id == cat.id) || {
                categoria_id: cat.id,
                costo_previsto: 0,
                costo_real: 0
            };
            bloques[cat.bloque].push({ ...gasto, ...cat });
        });

        // Renderizar cards
        const grid = document.getElementById('expensesGrid');
        grid.innerHTML = '';

        Object.entries(bloques).forEach(([bloque, items]) => {
            const subtotalPrevisto = items.reduce((sum, item) => sum + (item.costo_previsto || 0), 0);
            const subtotalReal = items.reduce((sum, item) => sum + (item.costo_real || 0), 0);
            grid.appendChild(crearBloqueCardModerno(bloque, items, subtotalPrevisto, subtotalReal));
        });

    } catch (error) {
        console.error('Error cargando gastos:', error);
    }
}

function crearBloqueCardModerno(bloque, items, subtotalPrevisto, subtotalReal) {
    const div = document.createElement('div');
    div.className = 'expense-card';

    const progreso = subtotalPrevisto > 0 ? Math.min((subtotalReal / subtotalPrevisto) * 100, 100) : 0;
    const diferencia = subtotalReal - subtotalPrevisto;

    div.innerHTML = `
    <div class="expense-header">
      <div>
        <div class="expense-title">${bloque}</div>
        <div style="font-size: 0.9rem; color: #718096;">${items.length} categorías</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 0.9rem; color: #718096;">Gasto Real</div>
        <div style="font-weight: 600; color: #2d3748;">
          ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(subtotalReal)}
        </div>
      </div>
    </div>
    
    <div class="expense-progress">
      <div class="expense-progress-bar" style="width: ${progreso}%"></div>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin: 20px 0; font-size: 0.85rem; color: #718096;">
      <span>Gasto previsto: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(subtotalPrevisto)}</span>
      <span>${Math.round(progreso)}% usado</span>
    </div>
    
    ${items.map(item => `
      <div class="category-item">
        <div class="category-name">${item.nombre}</div>
        <div class="expense-inputs">
          <div class="expense-input-wrapper">
            <label>Previsto</label>
            <input type="number" step="0.01" value="${item.costo_previsto || 0}" 
                   onchange="actualizarGasto(${item.categoria_id}, this.value, null)"
                   placeholder="0.00">
          </div>
          <div class="expense-input-wrapper">
            <label>Real</label>
            <input type="number" step="0.01" value="${item.costo_real || 0}" 
                   onchange="actualizarGasto(${item.categoria_id}, null, this.value)"
                   placeholder="0.00">
          </div>
        </div>
        <div class="category-badge ${item.costo_real <= item.costo_previsto ? 'badge-success' : 'badge-danger'}">
          ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((item.costo_real || 0) - (item.costo_previsto || 0))}
        </div>
      </div>
    `).join('')}
  `;

    return div;
}

async function actualizarGasto(categoriaId, costoPrevisto, costoReal) {
    try {
        const gastoExistente = gastosActuales.find(g => g.categoria_id == categoriaId) || {};

        await fetch(`/api/gastos/${mesActual}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                categoria_id: categoriaId,
                costo_previsto: costoPrevisto !== null ? parseFloat(costoPrevisto) || 0 : (gastoExistente.costo_previsto || 0),
                costo_real: costoReal !== null ? parseFloat(costoReal) || 0 : (gastoExistente.costo_real || 0)
            })
        });

        // 🔧 CLAVE: Recargar TODO (resumen + gastos)
        await cargarMes();

    } catch (error) {
        console.error('Error actualizando gasto:', error);
    }
}


async function guardarIngresos() {
    const previsto = parseFloat(document.getElementById('ingreso-previsto').value) || 0;
    const real = parseFloat(document.getElementById('ingreso-real').value) || 0;

    try {
        // Guardar ingresos previstos
        await fetch(`/api/ingresos/${mesActual}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'previsto',
                concepto: 'Ingreso 1',
                monto: previsto
            })
        });

        // Guardar ingresos reales
        await fetch(`/api/ingresos/${mesActual}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'real',
                concepto: 'Ingreso 1',
                monto: real
            })
        });

        alert('✅ Ingresos actualizados');
        await cargarMes(); // ← RECARGA TODO el dashboard
    } catch (error) {
        console.error('Error guardando ingresos:', error);
        alert('Error guardando ingresos');
    }
}


async function nuevoMes() {
    const nombre = prompt('Nombre del mes (ej: "Enero 2026")');
    if (!nombre) return;

    // Pedir ingresos
    const ingresosPrevisto = prompt('Ingresos previstos (€):', '2500');
    const ingresosReal = prompt('Ingresos reales (€):', '0');

    if (ingresosPrevisto === null || ingresosReal === null) return;

    try {
        const [mesStr, anioStr] = nombre.split(' ');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const mesNum = meses.findIndex(m => m.toLowerCase() === mesStr.toLowerCase()) + 1;

        if (mesNum === 0 || !anioStr) {
            alert('Formato: "Enero 2026"');
            return;
        }

        // 1. Crear mes
        const responseMes = await fetch('/api/meses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anio: parseInt(anioStr),
                mes_numero: mesNum,
                nombre_mes: nombre
            })
        });
        const nuevoMes = await responseMes.json();

        // 2. Añadir ingresos previstos
        await fetch(`/api/ingresos/${nuevoMes.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'previsto',
                concepto: 'Ingreso 1',
                monto: parseFloat(ingresosPrevisto) || 0
            })
        });

        // 3. Añadir ingresos reales (si hay)
        if (parseFloat(ingresosReal) > 0) {
            await fetch(`/api/ingresos/${nuevoMes.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'real',
                    concepto: 'Ingreso 1',
                    monto: parseFloat(ingresosReal) || 0
                })
            });
        }

        // 4. Recargar meses y seleccionar el nuevo
        await cargarMeses();
        document.getElementById('mesSelect').value = nuevoMes.id;
        await cargarMes(); // Cargar datos del nuevo mes

        alert('✅ Mes creado con ingresos');
    } catch (error) {
        console.error('Error creando mes:', error);
        alert('Error creando mes');
    }
}



