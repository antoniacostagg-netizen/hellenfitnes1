// Variáveis globais
let currentUser = null;
let editingProductId = null;

// Inicializar o painel administrativo
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    setupAdminEventListeners();
});

// Verificar estado de autenticação
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showAdminDashboard();
            loadAdminData();
        } else {
            currentUser = null;
            showLoginForm();
        }
    });
}

// Mostrar formulário de login
function showLoginForm() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

// Mostrar painel administrativo
function showAdminDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
}

// Configurar event listeners
function setupAdminEventListeners() {
    // Login
    document.getElementById('admin-login-form').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('admin-logout').addEventListener('click', handleLogout);
    
    // Navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchAdminSection(this.getAttribute('href').substring(1));
        });
    });
    
    // Configurações do site
    document.getElementById('site-settings-form').addEventListener('submit', saveSiteSettings);
    
    // Produtos
    document.getElementById('add-product-btn').addEventListener('click', showProductForm);
    document.getElementById('add-image-btn').addEventListener('click', addImageInput);
    document.getElementById('add-color-btn').addEventListener('click', addColorInput);
    document.getElementById('cancel-product-btn').addEventListener('click', hideProductForm);
    document.getElementById('product-form').addEventListener('submit', saveProduct);
}

// Fazer login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    
    login(email, password)
        .then(() => {
            errorElement.textContent = '';
        })
        .catch(error => {
            errorElement.textContent = 'Erro no login: ' + error.message;
        });
}

// Fazer logout
function handleLogout() {
    logout().catch(error => {
        console.error('Erro ao fazer logout:', error);
    });
}

// Alternar entre seções do admin
function switchAdminSection(sectionId) {
    // Atualizar navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.nav-link[href="#${sectionId}"]`).classList.add('active');
    
    // Mostrar seção selecionada
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Carregar dados específicos da seção
    if (sectionId === 'products') {
        loadProductsList();
    } else if (sectionId === 'inventory') {
        loadInventoryTable();
    }
}

// Carregar dados do admin
function loadAdminData() {
    loadSiteSettingsForAdmin();
    loadProductsList();
}

// Carregar configurações do site para edição
function loadSiteSettingsForAdmin() {
    settingsRef.get().then(doc => {
        if (doc.exists) {
            const settings = doc.data();
            
            // Preencher formulário
            document.getElementById('site-logo-url').value = settings.logo || '';
            document.getElementById('primary-color').value = settings.primaryColor || '#4a90e2';
            document.getElementById('secondary-color').value = settings.secondaryColor || '#f8f9fa';
            document.getElementById('text-color').value = settings.textColor || '#333333';
            document.getElementById('background-color').value = settings.backgroundColor || '#ffffff';
            document.getElementById('accent-color').value = settings.accentColor || '#e74c3c';
            document.getElementById('header-message').value = settings.headerMessage || '';
            document.getElementById('footer-content').value = settings.footerContent || '';
            document.getElementById('whatsapp-number').value = settings.whatsappNumber || '';
        }
    }).catch(error => {
        console.error('Erro ao carregar configurações:', error);
    });
}

// Salvar configurações do site
function saveSiteSettings(e) {
    e.preventDefault();
    
    const settings = {
        logo: document.getElementById('site-logo-url').value,
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        textColor: document.getElementById('text-color').value,
        backgroundColor: document.getElementById('background-color').value,
        accentColor: document.getElementById('accent-color').value,
        headerMessage: document.getElementById('header-message').value,
        footerContent: document.getElementById('footer-content').value,
        whatsappNumber: document.getElementById('whatsapp-number').value,
        updatedAt: new Date().toISOString()
    };
    
    settingsRef.set(settings, { merge: true })
        .then(() => {
            alert('Configurações salvas com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao salvar configurações:', error);
            alert('Erro ao salvar configurações.');
        });
}

// Carregar lista de produtos
function loadProductsList() {
    productsRef.where('active', '==', true).get().then(snapshot => {
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        
        if (snapshot.empty) {
            productsList.innerHTML = '<p>Nenhum produto cadastrado.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card-admin';
            productCard.innerHTML = `
                <h4>${product.name}</h4>
                <p><strong>Preço:</strong> R$ ${product.price.toFixed(2)}</p>
                <p><strong>Categoria:</strong> ${getCategoryName(product.category)}</p>
                <p><strong>Cores:</strong> ${Object.keys(product.stock || {}).join(', ')}</p>
                <div class="product-actions">
                    <button class="edit-btn" data-id="${product.id}">Editar</button>
                    <button class="delete-btn" data-id="${product.id}">Excluir</button>
                </div>
            `;
            
            productsList.appendChild(productCard);
        });
        
        // Adicionar event listeners para os botões
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                editProduct(this.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteProduct(this.getAttribute('data-id'));
            });
        });
    }).catch(error => {
        console.error('Erro ao carregar produtos:', error);
    });
}

// Obter nome da categoria
function getCategoryName(category) {
    const categories = {
        'conjuntos': 'Conjuntos',
        'macaquinhos': 'Macaquinhos',
        'tops': 'Tops',
        'shorts': 'Shorts'
    };
    return categories[category] || category;
}

// Mostrar formulário de produto
function showProductForm() {
    editingProductId = null;
    document.getElementById('product-form-title').textContent = 'Adicionar Produto';
    document.getElementById('product-form-container').style.display = 'block';
    document.getElementById('product-form').reset();
    
    // Limpar inputs dinâmicos
    document.getElementById('image-inputs').innerHTML = '<input type="url" class="image-url" placeholder="URL da imagem 1" required>';
    document.getElementById('color-stock-inputs').innerHTML = `
        <div class="color-stock-row">
            <input type="text" class="color-name" placeholder="Nome da cor" required>
            <input type="number" class="color-stock" placeholder="Estoque" min="0" required>
            <button type="button" class="remove-color-btn">🗑️</button>
        </div>
    `;
    
    // Adicionar event listeners para remover
    setupDynamicInputsEvents();
}

// Esconder formulário de produto
function hideProductForm() {
    document.getElementById('product-form-container').style.display = 'none';
}

// Editar produto
function editProduct(productId) {
    productsRef.doc(productId).get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            editingProductId = productId;
            
            document.getElementById('product-form-title').textContent = 'Editar Produto';
            document.getElementById('product-form-container').style.display = 'block';
            
            // Preencher formulário
            document.getElementById('product-id').value = productId;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            
            // Preencher imagens
            const imageInputs = document.getElementById('image-inputs');
            imageInputs.innerHTML = '';
            product.images.forEach((image, index) => {
                const input = document.createElement('input');
                input.type = 'url';
                input.className = 'image-url';
                input.placeholder = `URL da imagem ${index + 1}`;
                input.value = image;
                input.required = index === 0;
                imageInputs.appendChild(input);
            });
            
            // Preencher cores e estoque
            const colorInputs = document.getElementById('color-stock-inputs');
            colorInputs.innerHTML = '';
            Object.entries(product.stock).forEach(([color, stock]) => {
                const row = document.createElement('div');
                row.className = 'color-stock-row';
                row.innerHTML = `
                    <input type="text" class="color-name" placeholder="Nome da cor" value="${color}" required>
                    <input type="number" class="color-stock" placeholder="Estoque" value="${stock}" min="0" required>
                    <button type="button" class="remove-color-btn">🗑️</button>
                `;
                colorInputs.appendChild(row);
            });
            
            // Adicionar event listeners para remover
            setupDynamicInputsEvents();
        }
    }).catch(error => {
        console.error('Erro ao carregar produto:', error);
        alert('Erro ao carregar dados do produto.');
    });
}

// Adicionar input de imagem
function addImageInput() {
    const imageInputs = document.getElementById('image-inputs');
    const currentInputs = imageInputs.querySelectorAll('.image-url');
    
    if (currentInputs.length >= 3) {
        alert('Máximo de 3 imagens permitido.');
        return;
    }
    
    const newInput = document.createElement('input');
    newInput.type = 'url';
    newInput.className = 'image-url';
    newInput.placeholder = `URL da imagem ${currentInputs.length + 1}`;
    imageInputs.appendChild(newInput);
}

// Adicionar input de cor e estoque
function addColorInput() {
    const colorInputs = document.getElementById('color-stock-inputs');
    
    const newRow = document.createElement('div');
    newRow.className = 'color-stock-row';
    newRow.innerHTML = `
        <input type="text" class="color-name" placeholder="Nome da cor" required>
        <input type="number" class="color-stock" placeholder="Estoque" min="0" required>
        <button type="button" class="remove-color-btn">🗑️</button>
    `;
    colorInputs.appendChild(newRow);
    
    // Adicionar event listener para o botão de remover
    newRow.querySelector('.remove-color-btn').addEventListener('click', function() {
        if (colorInputs.children.length > 1) {
            colorInputs.removeChild(newRow);
        } else {
            alert('Pelo menos uma cor é necessária.');
        }
    });
}

// Configurar eventos para inputs dinâmicos
function setupDynamicInputsEvents() {
    // Botões de remover cor
    document.querySelectorAll('.remove-color-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const colorInputs = document.getElementById('color-stock-inputs');
            if (colorInputs.children.length > 1) {
                colorInputs.removeChild(this.parentElement);
            } else {
                alert('Pelo menos uma cor é necessária.');
            }
        });
    });
}

// Salvar produto
function saveProduct(e) {
    e.preventDefault();
    
    // Coletar dados do formulário
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        active: true,
        updatedAt: new Date().toISOString()
    };
    
    // Coletar imagens
    const imageUrls = Array.from(document.querySelectorAll('.image-url'))
        .map(input => input.value.trim())
        .filter(url => url !== '');
    
    if (imageUrls.length === 0) {
        alert('Pelo menos uma imagem é necessária.');
        return;
    }
    
    productData.images = imageUrls;
    
    // Coletar cores e estoque
    const stock = {};
    const colorRows = document.querySelectorAll('.color-stock-row');
    
    colorRows.forEach(row => {
        const colorName = row.querySelector('.color-name').value.trim();
        const colorStock = parseInt(row.querySelector('.color-stock').value);
        
        if (colorName && !isNaN(colorStock)) {
            stock[colorName] = colorStock;
        }
    });
    
    if (Object.keys(stock).length === 0) {
        alert('Pelo menos uma cor com estoque é necessária.');
        return;
    }
    
    productData.stock = stock;
    
    // Salvar no Firestore
    let savePromise;
    
    if (editingProductId) {
        // Atualizar produto existente
        savePromise = productsRef.doc(editingProductId).update(productData);
    } else {
        // Adicionar novo produto
        productData.createdAt = new Date().toISOString();
        savePromise = productsRef.add(productData);
    }
    
    savePromise
        .then(() => {
            alert('Produto salvo com sucesso!');
            hideProductForm();
            loadProductsList();
            loadInventoryTable();
        })
        .catch(error => {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto.');
        });
}

// Excluir produto
function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        productsRef.doc(productId).update({ active: false })
            .then(() => {
                alert('Produto excluído com sucesso!');
                loadProductsList();
                loadInventoryTable();
            })
            .catch(error => {
                console.error('Erro ao excluir produto:', error);
                alert('Erro ao excluir produto.');
            });
    }
}

// Carregar tabela de estoque
function loadInventoryTable() {
    productsRef.where('active', '==', true).get().then(snapshot => {
        const tableBody = document.querySelector('#inventory-table tbody');
        tableBody.innerHTML = '';
        
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4">Nenhum produto encontrado.</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            
            const row = document.createElement('tr');
            
            // Célula de cores/estoque
            let stockHtml = '';
            Object.entries(product.stock).forEach(([color, quantity]) => {
                stockHtml += `<span class="stock-color">${color}: ${quantity}</span> `;
            });
            
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${getCategoryName(product.category)}</td>
                <td class="stock-cell">${stockHtml}</td>
                <td>
                    <button class="edit-btn" data-id="${product.id}">Editar</button>
                    <button class="delete-btn" data-id="${product.id}">Excluir</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Adicionar event listeners para os botões
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                switchAdminSection('products');
                setTimeout(() => editProduct(this.getAttribute('data-id')), 100);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteProduct(this.getAttribute('data-id'));
            });
        });
    }).catch(error => {
        console.error('Erro ao carregar estoque:', error);
    });
}
