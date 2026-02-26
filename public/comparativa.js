document.addEventListener('DOMContentLoaded', async function () {
    await cargarComparativa();
});

async function cargarComparativa() {
    try {
        const response = await fetch('/api/comparativa');
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        const datos = await response.json();

        const grid = document.getElementById('comparativaGrid');
        grid.innerHTML = '';

        if (datos.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #718096; padding: 40px;">No hay meses registrados para comparar.</p>';
            return;
        }

        datos.forEach(mes => {
            const card = document.createElement('div');
            card.className = 'expense-card';

            const formatoMoneda = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

            card.innerHTML = `
                <div class="expense-header">
                    <div>
                        <div class="expense-title">${mes.nombre_mes}</div>
                        <div style="font-size: 0.9rem; color: #718096;">Año ${mes.anio}</div>
                    </div>
                </div>
                
                <div class="comparison-grid" style="grid-template-columns: 1fr; gap: 10px; margin-top: 20px;">
                    <div class="comparison-item" style="background: rgba(245, 101, 101, 0.05); border: 1px solid rgba(245, 101, 101, 0.1);">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.85rem; color: #718096; font-weight: 600; text-transform: uppercase;">Gasto Real</span>
                            <span class="money" style="color: #e53e3e;">${formatoMoneda.format(mes.total_gastos_real)}</span>
                        </div>
                        <i class="fas fa-shopping-cart" style="color: #f56565; font-size: 1.2rem; opacity: 0.5;"></i>
                    </div>
                    
                    <div class="comparison-item highlight" style="background: rgba(72, 187, 120, 0.05); border: 1px solid rgba(72, 187, 120, 0.2);">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.85rem; color: #718096; font-weight: 600; text-transform: uppercase;">Saldo Restante</span>
                            <span class="money" style="color: #38a169;">${formatoMoneda.format(mes.saldo_real)}</span>
                        </div>
                        <i class="fas fa-piggy-bank" style="color: #48bb78; font-size: 1.2rem; opacity: 0.5;"></i>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error cargando la comparativa:', error);
        alert('Error al cargar los datos de comparativa.');
    }
}
