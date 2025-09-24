// Variáveis globais
let currentSettings = {};
let currentProducts = [];

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Função de inicialização
function initializeApp() {
    // Carregar configurações do site
    loadSiteSettings();
    
    // Carregar produtos
    loadProducts();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Atualizar exibição do carrinho
    updateCartDisplay();
}

// Carregar configurações do site
function loadSiteSettings() {
    settingsRef.get().then(doc => {
        if (doc.exists) {
            currentSettings = doc.data();
            applySiteSettings();
        } else {
            // Configurações padrão
            currentSettings = {
                logo: '',
                primaryColor: '#4a90e2',
                secondaryColor: '#f8f9fa',
                textColor: '#333',
                backgroundColor: '#fff',
                accentColor: '#e74c3c',
                headerMessage: 'Escolha seu produto e seu pedido será enviado via WhatsApp.',
                footerContent: '<p>Hellen Moda Fitness &copy; 2023</p>',
                whatsappNumber: '5511999999999'
            };
            applySiteSettings();
        }
    }).catch(error => {
        console.error('Erro ao carregar configurações:', error);
    });
}

// Aplicar configurações do site
function applySiteSettings() {
    // Aplicar cores CSS
    document.documentElement.style.setProperty('--primary-color', currentSettings.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', currentSettings.secondaryColor);
    document.documentElement.style.setProperty('--text-color', currentSettings.textColor);
    document.documentElement.style.setProperty('--background-color', currentSettings.backgroundColor);
    document.documentElement.style.setProperty('--accent-color', currentSettings.accentColor);
    
    // Aplicar logo
    const logoElement = document.getElementById('site-logo');
    if (currentSettings.logo) {
        logoElement.innerHTML = `<img src="${currentSettings.logo}" alt="Logo">`;
    } else {
        logoElement.textContent = 'Hellen Moda Fitness';
    }
    
    // Aplicar mensagem do header
    document.getElementById('header-message').textContent = currentSettings.headerMessage;
    
    // Aplicar conteúdo do footer
    document.getElementById('footer-content').innerHTML = currentSettings.footerContent;
}

// Carregar produtos
function loadProducts(category = 'all') {
    const productsGrid = document.getElementById('products-grid');
    const categoryTitle = document.getElementById('category-title');
    
    // Mostrar loading
    productsGrid.innerHTML = '<p>Carregando produtos...</p>';
    
    loadProducts(category).then(products => {
        currentProducts = products;
        displayProducts(products);
        
        // Atualizar título da categoria
        const categoryNames = {
            'all': 'Todos os produtos',
            'conjuntos': 'Conjuntos',
            'macaquinhos': 'Macaquinhos',
            'tops': 'Tops',
            'shorts': 'Shorts'
        };
        categoryTitle.textContent = categoryNames[category] || 'Produtos';
    }).catch(error => {
        console.error('Erro ao carregar produtos:', error);
        productsGrid.innerHTML = '<p>Erro ao carregar produtos. Tente novamente.</p>';
    });
}

// Exibir produtos na grade
function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
        return;
    }
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.images[0]}" alt="${product.name}" class="product-image" data-product="${product.id}">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                <button class="buy-btn" data-product="${product.id}">Comprar</button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
    
    // Adicionar event listeners para os botões de compra
    document.querySelectorAll('.buy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product');
            openProductPopup(productId);
        });
    });
    
    // Adicionar event listeners para as imagens dos produtos
    document.querySelectorAll('.product-image').forEach(image => {
        image.addEventListener('click', function() {
            const productId = this.getAttribute('data-product');
            openProductPopup(productId);
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Menu lateral
    document.getElementById('menu-btn').addEventListener('click', openMenu);
    document.getElementById('close-menu').addEventListener('click', closeMenu);
    
    // Carrinho
    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    
    // Finalização de compra
    document.getElementById('checkout-btn').addEventListener('click', openCheckout);
    document.getElementById('floating-checkout-btn').addEventListener('click', openCheckout);
    document.getElementById('close-checkout').addEventListener('click', closeCheckout);
    document.getElementById('checkout-form').addEventListener('submit', submitOrder);
    
    // Overlay
    document.getElementById('overlay').addEventListener('click', function() {
        closeMenu();
        closeCart();
        closeCheckout();
        closeProductPopup();
    });
    
    // Navegação por categoria
    document.querySelectorAll('.menu-list a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            loadProducts(category);
            closeMenu();
        });
    });
    
    // Botão home
    document.getElementById('home-btn').addEventListener('click', function() {
        loadProducts('all');
    });
}

// Abrir menu lateral
function openMenu() {
    document.getElementById('side-menu').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

// Fechar menu lateral
function closeMenu() {
    document.getElementById('side-menu').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Abrir carrinho
function openCart() {
    document.getElementById('cart-panel').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

// Fechar carrinho
function closeCart() {
    document.getElementById('cart-panel').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Abrir popup de finalização
function openCheckout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Atualizar resumo do pedido
    updateOrderSummary();
    
    document.getElementById('checkout-popup').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

// Fechar popup de finalização
function closeCheckout() {
    document.getElementById('checkout-popup').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Abrir popup do produto
function openProductPopup(productId) {
    loadProduct(productId).then(product => {
        displayProductDetails(product);
        document.getElementById('product-popup').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    }).catch(error => {
        console.error('Erro ao carregar produto:', error);
        alert('Erro ao carregar detalhes do produto.');
    });
}

// Fechar popup do produto
function closeProductPopup() {
    document.getElementById('product-popup').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Exibir detalhes do produto
function displayProductDetails(product) {
    const productDetails = document.getElementById('product-details');
    
    // Gerar opções de cores
    let colorOptions = '';
    Object.keys(product.stock).forEach(color => {
        colorOptions += `
            <div class="color-option">
                <button class="color-btn" data-color="${color}">${color}</button>
            </div>
        `;
    });
    
    productDetails.innerHTML = `
        <div class="product-images">
            <img src="${product.images[0]}" alt="${product.name}" class="main-product-image" id="main-product-image">
            <div class="product-thumbnails-detail">
                ${product.images.map((image, index) => `
                    <img src="${image}" alt="Thumbnail ${index+1}" class="product-thumb-detail ${index === 0 ? 'active' : ''}" data-image="${image}">
                `).join('')}
            </div>
        </div>
        <div class="product-info-detail">
            <h2>${product.name}</h2>
            <div class="product-price-detail">R$ ${product.price.toFixed(2)}</div>
            <div class="color-options">
                <label>Cor:</label>
                <div id="color-buttons">${colorOptions}</div>
            </div>
            <div class="quantity-selector">
                <label for="product-quantity">Quantidade:</label>
                <input type="number" id="product-quantity" class="quantity-input" min="1" value="1">
            </div>
            <button class="add-to-cart-btn" id="add-to-cart-detail">Adicionar ao Carrinho</button>
        </div>
    `;
    
    // Configurar event listeners para o popup do produto
    setupProductPopupEvents(product);
}

// Configurar eventos do popup do produto
function setupProductPopupEvents(product) {
    // Miniaturas das imagens
    document.querySelectorAll('.product-thumb-detail').forEach(thumb => {
        thumb.addEventListener('click', function() {
            const imageUrl = this.getAttribute('data-image');
            document.getElementById('main-product-image').src = imageUrl;
            
            // Atualizar miniaturas ativas
            document.querySelectorAll('.product-thumb-detail').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Seleção de cor
    let selectedColor = Object.keys(product.stock)[0];
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectedColor = this.getAttribute('data-color');
            
            // Atualizar botões de cor ativos
            document.querySelectorAll('.color-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
        
        // Definir primeiro botão como ativo
        if (this.getAttribute('data-color') === selectedColor) {
            this.classList.add('active');
        }
    });
    
    // Adicionar ao carrinho
    document.getElementById('add-to-cart-detail').addEventListener('click', function() {
        const quantity = parseInt(document.getElementById('product-quantity').value);
        
        if (quantity < 1) {
            alert('Quantidade deve ser pelo menos 1.');
            return;
        }
        
        // Verificar estoque
        checkStock(product.id, selectedColor, quantity).then(available => {
            if (available) {
                addToCart(product, selectedColor, quantity);
                alert('Produto adicionado ao carrinho!');
                closeProductPopup();
            } else {
                alert('Estoque insuficiente para a quantidade selecionada.');
            }
        }).catch(error => {
            console.error('Erro ao verificar estoque:', error);
            alert('Erro ao verificar disponibilidade do produto.');
        });
    });
}

// Atualizar resumo do pedido
function updateOrderSummary() {
    const orderSummary = document.getElementById('order-summary-items');
    const orderTotal = document.getElementById('order-total');
    
    let summaryHTML = '';
    cart.forEach(item => {
        summaryHTML += `
            <div class="order-item">
                <span>${item.name} (${item.color}) x${item.quantity}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });
    
    orderSummary.innerHTML = summaryHTML;
    orderTotal.textContent = calculateCartTotal().toFixed(2);
}

// Enviar pedido
function submitOrder(e) {
    e.preventDefault();
    
    // Validar quantidade mínima
    if (countTotalItems() < 10) {
        alert('Pedido mínimo de 10 peças não atingido.');
        return;
    }
    
    // Coletar dados do formulário
    const formData = {
        name: document.getElementById('customer-name').value,
        cep: document.getElementById('customer-cep').value,
        address: document.getElementById('customer-address').value,
        deliveryType: document.getElementById('delivery-type').value,
        phone: document.getElementById('customer-phone').value,
        payment: document.querySelector('input[name="payment"]:checked').value,
        notes: document.getElementById('order-notes').value,
        items: cart,
        total: calculateCartTotal(),
        timestamp: new Date().toISOString()
    };
    
    // Criar mensagem para WhatsApp
    const whatsappMessage = createWhatsAppMessage(formData);
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${currentSettings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    // Limpar carrinho e fechar popup
    clearCart();
    closeCheckout();
    
    // Redirecionar para home após um tempo
    setTimeout(() => {
        loadProducts('all');
    }, 1000);
}

// Criar mensagem para WhatsApp
function createWhatsAppMessage(orderData) {
    let message = `*NOVO PEDIDO - HELLEN MODA FITNESS*\n\n`;
    message += `*Cliente:* ${orderData.name}\n`;
    message += `*Telefone:* ${orderData.phone}\n`;
    message += `*CEP:* ${orderData.cep}\n`;
    message += `*Endereço:* ${orderData.address}\n`;
    message += `*Tipo de Entrega:* ${orderData.deliveryType}\n`;
    message += `*Forma de Pagamento:* ${orderData.payment.toUpperCase()}\n\n`;
    
    message += `*ITENS DO PEDIDO:*\n`;
    orderData.items.forEach(item => {
        message += `- ${item.name} (${item.color}) x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*TOTAL: R$ ${orderData.total.toFixed(2)}*\n\n`;
    
    if (orderData.notes) {
        message += `*Observações:* ${orderData.notes}\n\n`;
    }
    
    message += `Pedido realizado em: ${new Date().toLocaleString('pt-BR')}`;
    
    return message;
}

// Delegar eventos para elementos dinâmicos (carrinho)
document.addEventListener('click', function(e) {
    // Botões de quantidade no carrinho
    if (e.target.classList.contains('quantity-btn')) {
        const productId = e.target.getAttribute('data-product');
        const color = e.target.getAttribute('data-color');
        const item = cart.find(item => item.productId === productId && item.color === color);
        
        if (item) {
            let newQuantity = item.quantity;
            
            if (e.target.classList.contains('plus')) {
                newQuantity++;
            } else if (e.target.classList.contains('minus') && item.quantity > 1) {
                newQuantity--;
            }
            
            updateCartQuantity(productId, color, newQuantity);
        }
    }
    
    // Remover item do carrinho
    if (e.target.classList.contains('remove-item')) {
        const productId = e.target.getAttribute('data-product');
        const color = e.target.getAttribute('data-color');
        removeFromCart(productId, color);
    }
});
