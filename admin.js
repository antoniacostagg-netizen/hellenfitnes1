// Funções do Painel Administrativo
async function loadProductsForAdmin() {
    try {
        const snapshot = await productsRef.get();
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayStockTable(products);
        populateProductFormForEdit(products);
    } catch (error) {
        console.error('Erro ao carregar produtos para admin:', error);
    }
}

// Exibir tabela de estoque
function displayStockTable(products) {
    const tbody = document.getElementById('stock-tbody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        Object.entries(product.colors || {}).forEach(([colorName, colorData]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 20px; height: 20px; background-color: ${colorData.code}; border-radius: 50%; border: 1px solid #ccc;"></div>
                        ${colorName}
                    </div>
                </td>
                <td>
                    <input type="number" value="${colorData.stock}" 
                           onchange="updateStock('${product.id}', '${colorName}', this.value)"
                           class="stock-input" min="0">
                </td>
                <td>
                    <button onclick="deleteProductColor('${product.id}', '${colorName}')" class="delete-btn">🗑️</button>
                    <button onclick="editProduct('${product.id}')" class="edit-btn">✏️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    });
}

// Atualizar estoque
async function updateStock(productId, colorName, newStock) {
    try {
        const productRef = productsRef.doc(productId);
        await productRef.update({
            [`colors.${colorName}.stock`]: parseInt(newStock)
        });
        
        showNotification('Estoque atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
        showNotification('Erro ao atualizar estoque', 'error');
    }
}

// Deletar cor do produto
async function deleteProductColor(productId, colorName) {
    if (!confirm(`Tem certeza que deseja remover a cor ${colorName}?`)) return;
    
    try {
        const productRef = productsRef.doc(productId);
        await productRef.update({
            [`colors.${colorName}`]: firebase.firestore.FieldValue.delete()
        });
        
        showNotification('Cor removida com sucesso!', 'success');
        await loadProductsForAdmin();
    } catch (error) {
        console.error('Erro ao remover cor:', error);
        showNotification('Erro ao remover cor', 'error');
    }
}

// Deletar produto completo
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
        await productsRef.doc(productId).delete();
        showNotification('Produto excluído com sucesso!', 'success');
        await loadProductsForAdmin();
        await loadProducts(); // Recarregar produtos na loja
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showNotification('Erro ao excluir produto', 'error');
    }
}

// Configurar event listeners do admin
function setupAdminEventListeners() {
    // Formulário de configurações do site
    document.getElementById('site-settings-form').addEventListener('submit', handleSiteSettings);
    
    // Formulário de produto
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Botão adicionar cor
    document.getElementById('add-color-btn').addEventListener('click', addColorInput);
    
    // Carregar dados atuais no formulário de configurações
    loadCurrentSettings();
}

// Carregar configurações atuais no formulário
function loadCurrentSettings() {
    const settings = state.siteSettings;
    
    document.getElementById('logo-url').value = settings.logoUrl || '';
    document.getElementById('primary-color').value = settings.primaryColor || '#ff6b6b';
    document.getElementById('secondary-color').value = settings.secondaryColor || '#4ecdc4';
    document.getElementById('text-color').value = settings.textColor || '#333';
    document.getElementById('banner-message-input').value = settings.bannerMessage || '';
    document.getElementById('footer-content-input').value = settings.footerContent || '';
    document.getElementById('whatsapp-number').value = settings.whatsappNumber || '';
}

// Salvar configurações do site
async function handleSiteSettings(e) {
    e.preventDefault();
    
    const newSettings = {
        logoUrl: document.getElementById('logo-url').value,
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        textColor: document.getElementById('text-color').value,
        bannerMessage: document.getElementById('banner-message-input').value,
        footerContent: document.getElementById('footer-content-input').value,
        whatsappNumber: document.getElementById('whatsapp-number').value,
        lastUpdated: new Date().toISOString()
    };
    
    try {
        await settingsRef.set(newSettings);
        state.siteSettings = newSettings;
        applySiteSettings();
        showNotification('Configurações salvas com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showNotification('Erro ao salvar configurações', 'error');
    }
}

// Adicionar campo de cor
function addColorInput() {
    const colorInputs = document.getElementById('color-inputs');
    const colorId = Date.now(); // ID único
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-input-group';
    colorDiv.innerHTML = `
        <div style="display: flex; gap: 0.5rem; margin: 0.5rem 0; align-items: center;">
            <input type="color" id="color-code-${colorId}" value="#ff6b6b">
            <input type="text" placeholder="Nome da cor" id="color-name-${colorId}">
            <input type="number" placeholder="Estoque" min="0" id="color-stock-${colorId}" value="0">
            <button type="button" onclick="removeColorInput(this)" class="remove-color-btn">✕</button>
        </div>
    `;
    colorInputs.appendChild(colorDiv);
}

// Remover campo de cor
function removeColorInput(button) {
    button.parentElement.parentElement.remove();
}

// Salvar/editar produto
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productId = document.getElementById('product-form').dataset.editingId;
    
    // Coletar cores
    const colors = {};
    document.querySelectorAll('.color-input-group').forEach(group => {
        const colorInputs = group.querySelectorAll('input');
        const colorCode = colorInputs[0].value;
        const colorName = colorInputs[1].value;
        const colorStock = parseInt(colorInputs[2].value);
        
        if (colorName && colorCode) {
            colors[colorName] = {
                code: colorCode,
                stock: colorStock
            };
        }
    });
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value.toLowerCase(),
        images: [
            document.getElementById('product-image1').value,
            document.getElementById('product-image2').value,
            document.getElementById('product-image3').value
        ].filter(url => url.trim() !== ''),
        colors: colors,
        createdAt: productId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        if (productId) {
            // Editar produto existente
            await productsRef.doc(productId).update(productData);
            showNotification('Produto atualizado com sucesso!', 'success');
        } else {
            // Novo produto
            await productsRef.add(productData);
            showNotification('Produto adicionado com sucesso!', 'success');
        }
        
        // Limpar formulário
        e.target.reset();
        document.getElementById('color-inputs').innerHTML = '';
        delete document.getElementById('product-form').dataset.editingId;
        
        // Recarregar dados
        await loadProductsForAdmin();
        await loadProducts();
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showNotification('Erro ao salvar produto', 'error');
    }
}

// Editar produto existente
function editProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    // Preencher formulário
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-image1').value = product.images[0] || '';
    document.getElementById('product-image2').value = product.images[1] || '';
    document.getElementById('product-image3').value = product.images[2] || '';
    
    // Limpar e adicionar cores
    const colorInputs = document.getElementById('color-inputs');
    colorInputs.innerHTML = '';
    
    Object.entries(product.colors || {}).forEach(([colorName, colorData]) => {
        addColorInput();
        const lastGroup = colorInputs.lastElementChild;
        const inputs = lastGroup.querySelectorAll('input');
        inputs[0].value = colorData.code;
        inputs[1].value = colorName;
        inputs[2].value = colorData.stock;
    });
    
    // Marcar como edição
    document.getElementById('product-form').dataset.editingId = productId;
    document.getElementById('save-product-btn').textContent = 'Atualizar Produto';
    
    // Scroll para o formulário
    document.querySelector('.admin-sections').scrollTop = 0;
}

// Popular formulário para edição (auxiliar)
function populateProductFormForEdit(products) {
    // Esta função pode ser expandida para criar botões de edição rápidos
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        font-weight: bold;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 3 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Gerenciamento de estoque em tempo real
function setupStockRealtimeUpdates() {
    productsRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
                // Atualizar produto na loja se estiver sendo visualizado
                const changedProduct = {
                    id: change.doc.id,
                    ...change.doc.data()
                };
                
                const productIndex = state.products.findIndex(p => p.id === changedProduct.id);
                if (productIndex > -1) {
                    state.products[productIndex] = changedProduct;
                    
                    // Se o produto atual está sendo visualizado, atualizar UI
                    if (state.currentProduct && state.currentProduct.id === changedProduct.id) {
                        viewProduct(changedProduct.id);
                    }
                }
                
                // Atualizar tabela de estoque no admin
                if (state.currentUser) {
                    loadProductsForAdmin();
                }
            }
        });
    });
}

// Inicializar atualizações em tempo real
setupStockRealtimeUpdates();
