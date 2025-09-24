// Estado global da aplicação
const state = {
    currentUser: null,
    products: [],
    cart: [],
    currentProduct: null,
    siteSettings: {},
    whatsappNumber: ''
};

// Elementos DOM
const elements = {
    // Header e Navegação
    sideMenu: document.getElementById('side-menu'),
    menuBtn: document.querySelector('.menu-btn'),
    closeMenuBtn: document.getElementById('close-menu'),
    homeBtn: document.querySelector('.home-btn'),
    cartBtn: document.querySelector('.cart-btn'),
    
    // Conteúdo
    productsSection: document.getElementById('products-section'),
    productPage: document.getElementById('product-page'),
    cartPage: document.getElementById('cart-page'),
    productsGrid: document.getElementById('products-grid'),
    productDetail: document.getElementById('product-detail'),
    cartContent: document.getElementById('cart-content'),
    
    // Botões e Modals
    floatingCheckout: document.getElementById('floating-checkout'),
    checkoutModal: document.getElementById('checkout-modal'),
    closeCheckout: document.getElementById('close-checkout'),
    checkoutForm: document.getElementById('checkout-form'),
    
    // Admin
    adminLoginBtn: document.getElementById('admin-login-btn'),
    adminLoginModal: document.getElementById('admin-login-modal'),
    closeAdminLogin: document.getElementById('close-admin-login'),
    adminLoginForm: document.getElementById('admin-login-form'),
    adminPanel: document.getElementById('admin-panel'),
    logoutAdmin: document.getElementById('logout-admin'),
    
    // Configurações do Site
    siteLogo: document.getElementById('site-logo'),
    bannerMessage: document.getElementById('banner-message'),
    footerContent: document.getElementById('footer-content')
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    await loadSiteSettings();
    await loadProducts();
    setupEventListeners();
    checkAuthState();
    updateCartUI();
}

// Carregar configurações do site
async function loadSiteSettings() {
    try {
        const doc = await settingsRef.get();
        if (doc.exists) {
            state.siteSettings = doc.data();
            applySiteSettings();
        } else {
            // Configurações padrão
            state.siteSettings = {
                logoUrl: '',
                primaryColor: '#ff6b6b',
                secondaryColor: '#4ecdc4',
                textColor: '#333',
                bannerMessage: 'Escolha seu produto e seu pedido será enviado via WhatsApp.',
                footerContent: '<p>Contato: exemplo@email.com</p>',
                whatsappNumber: ''
            };
            await settingsRef.set(state.siteSettings);
            applySiteSettings();
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

// Aplicar configurações do site
function applySiteSettings() {
    const settings = state.siteSettings;
    
    // Aplicar cores
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor);
    document.documentElement.style.setProperty('--text-color', settings.textColor);
    
    // Aplicar logo
    if (settings.logoUrl) {
        elements.siteLogo.src = settings.logoUrl;
    }
    
    // Aplicar mensagem do banner
    elements.bannerMessage.textContent = settings.bannerMessage;
    
    // Aplicar conteúdo do footer
    elements.footerContent.innerHTML = settings.footerContent;
    
    // Salvar número do WhatsApp
    state.whatsappNumber = settings.whatsappNumber;
}

// Carregar produtos
async function loadProducts() {
    try {
        const snapshot = await productsRef.get();
        state.products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        displayProducts(state.products);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// Exibir produtos
function displayProducts(products) {
    elements.productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.images[0]}" alt="${product.name}" class="product-image">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">R$ ${product.price.toFixed(2)}</p>
            <button class="buy-btn" onclick="viewProduct('${product.id}')">Comprar</button>
        </div>
    `).join('');
}

// Visualizar produto
function viewProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    state.currentProduct = product;
    
    elements.productDetail.innerHTML = `
        <div class="product-detail-content">
            <div class="product-images">
                <img src="${product.images[0]}" alt="${product.name}" class="main-image" id="main-image">
                <div class="thumbnails">
                    ${product.images.map((img, index) => `
                        <img src="${img}" alt="Thumbnail ${index + 1}" 
                             class="thumbnail ${index === 0 ? 'active' : ''}" 
                             onclick="changeMainImage(${index})">
                    `).join('')}
                </div>
            </div>
            <div class="product-info">
                <h2>${product.name}</h2>
                <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                
                <div class="color-selection">
                    <h3>Cores Disponíveis:</h3>
                    <div class="color-options" id="color-options">
                        ${Object.entries(product.colors || {}).map(([colorName, colorData]) => `
                            <div class="color-option" 
                                 style="background-color: ${colorData.code}"
                                 title="${colorName} - Estoque: ${colorData.stock}"
                                 onclick="selectColor('${colorName}')"
                                 data-color="${colorName}">
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="quantity-selector">
                    <button class="quantity-btn" onclick="changeQuantity(-1)">-</button>
                    <span id="quantity">1</span>
                    <button class="quantity-btn" onclick="changeQuantity(1)">+</button>
                </div>
                
                <button class="buy-btn" onclick="addToCart()">Adicionar ao Carrinho</button>
            </div>
        </div>
    `;
    
    showSection(elements.productPage);
}

// Funções auxiliares para produto
function changeMainImage(index) {
    const product = state.currentProduct;
    document.getElementById('main-image').src = product.images[index];
    
    // Atualizar thumbnails ativos
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function selectColor(colorName) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.color === colorName);
    });
}

function changeQuantity(change) {
    const quantityElement = document.getElementById('quantity');
    let quantity = parseInt(quantityElement.textContent) + change;
    quantity = Math.max(1, quantity);
    quantityElement.textContent = quantity;
}

// Carrinho
function addToCart() {
    const selectedColorElement = document.querySelector('.color-option.active');
    if (!selectedColorElement) {
        alert('Por favor, selecione uma cor');
        return;
    }
    
    const colorName = selectedColorElement.dataset.color;
    const quantity = parseInt(document.getElementById('quantity').textContent);
    const product = state.currentProduct;
    
    const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        color: colorName,
        quantity: quantity,
        image: product.images[0]
    };
    
    // Verificar se item já está no carrinho
    const existingIndex = state.cart.findIndex(item => 
        item.productId === product.id && item.color === colorName
    );
    
    if (existingIndex > -1) {
        state.cart[existingIndex].quantity += quantity;
    } else {
        state.cart.push(cartItem);
    }
    
    updateCartUI();
    alert('Produto adicionado ao carrinho!');
}

function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Atualizar ícone do carrinho
    elements.cartBtn.innerHTML = totalItems > 0 ? `🛒 (${totalItems})` : '🛒';
    
    // Mostrar/ocultar botão flutuante
    elements.floatingCheckout.classList.toggle('hidden', totalItems === 0);
    
    // Atualizar conteúdo do carrinho
    if (elements.cartContent) {
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        elements.cartContent.innerHTML = `
            ${state.cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">
                    <div>
                        <h4>${item.name}</h4>
                        <p>Cor: ${item.color} | Qtd: ${item.quantity}</p>
                        <p>R$ ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button onclick="removeFromCart('${item.productId}', '${item.color}')">✕</button>
                </div>
            `).join('')}
            <div class="cart-total">
                Total: R$ ${total.toFixed(2)}
            </div>
            <button class="buy-btn" onclick="showCheckoutModal()">Finalizar Compra</button>
        `;
    }
}

function removeFromCart(productId, color) {
    state.cart = state.cart.filter(item => 
        !(item.productId === productId && item.color === color)
    );
    updateCartUI();
}

// Finalização de compra
function showCheckoutModal() {
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems < 10) {
        alert('Pedido mínimo de 10 peças!');
        return;
    }
    
    elements.checkoutForm.innerHTML = `
        <h3>Resumo do Pedido</h3>
        ${state.cart.map(item => `
            <p>${item.name} - ${item.color} x ${item.quantity} = R$ ${(item.price * item.quantity).toFixed(2)}</p>
        `).join('')}
        <p><strong>Total: R$ ${total.toFixed(2)}</strong></p>
        
        <h3>Dados de Entrega</h3>
        <input type="text" placeholder="Nome completo" required>
        <input type="text" placeholder="CEP" required>
        <small>O frete será calculado quando o pedido for enviado via WhatsApp.</small>
        <input type="text" placeholder="Endereço completo" required>
        
        <select required>
            <option value="">Tipo de entrega</option>
            <option value="transportadora">Transportadora</option>
            <option value="excursões">Excursões</option>
            <option value="uber">Uber</option>
            <option value="correio">Correio</option>
        </select>
        
        <input type="tel" placeholder="Telefone" required>
        
        <h3>Forma de Pagamento</h3>
        <p><strong>PIX</strong></p>
        
        <button type="submit">Enviar Pedido via WhatsApp</button>
    `;
    
    elements.checkoutModal.classList.remove('hidden');
}

// Configurar event listeners
function setupEventListeners() {
    // Navegação
    elements.menuBtn.addEventListener('click', () => {
        elements.sideMenu.classList.add('active');
    });
    
    elements.closeMenuBtn.addEventListener('click', () => {
        elements.sideMenu.classList.remove('active');
    });
    
    elements.homeBtn.addEventListener('click', () => {
        showSection(elements.productsSection);
        elements.sideMenu.classList.remove('active');
    });
    
    elements.cartBtn.addEventListener('click', () => {
        showSection(elements.cartPage);
        elements.sideMenu.classList.remove('active');
    });
    
    // Botões voltar
    document.getElementById('back-to-products').addEventListener('click', () => {
        showSection(elements.productsSection);
    });
    
    document.getElementById('back-from-cart').addEventListener('click', () => {
        showSection(elements.productsSection);
    });
    
    // Fechar modals
    elements.closeCheckout.addEventListener('click', () => {
        elements.checkoutModal.classList.add('hidden');
    });
    
    // Admin
    elements.adminLoginBtn.addEventListener('click', () => {
        elements.adminLoginModal.classList.remove('hidden');
    });
    
    elements.closeAdminLogin.addEventListener('click', () => {
        elements.adminLoginModal.classList.add('hidden');
    });
    
    // Formulário de checkout
    elements.checkoutForm.addEventListener('submit', handleCheckout);
    
    // Login admin
    elements.adminLoginForm.addEventListener('submit', handleAdminLogin);
    
    // Logout admin
    elements.logoutAdmin.addEventListener('click', handleAdminLogout);
}

function showSection(section) {
    // Ocultar todas as seções
    elements.productsSection.classList.add('hidden');
    elements.productPage.classList.add('hidden');
    elements.cartPage.classList.add('hidden');
    
    // Mostrar seção selecionada
    section.classList.remove('hidden');
}

// Finalizar compra via WhatsApp
function handleCheckout(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const orderData = {
        items: state.cart,
        total: state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        customer: {
            name: formData.get('name'),
            cep: formData.get('cep'),
            address: formData.get('address'),
            delivery: formData.get('delivery'),
            phone: formData.get('phone')
        },
        timestamp: new Date().toISOString()
    };
    
    // Criar mensagem para WhatsApp
    let message = `*NOVO PEDIDO*%0A%0A`;
    message += `*Cliente:* ${orderData.customer.name}%0A`;
    message += `*Telefone:* ${orderData.customer.phone}%0A`;
    message += `*CEP:* ${orderData.customer.cep}%0A`;
    message += `*Endereço:* ${orderData.customer.address}%0A`;
    message += `*Entrega:* ${orderData.customer.delivery}%0A%0A`;
    
    message += `*ITENS:*%0A`;
    orderData.items.forEach(item => {
        message += `▫ ${item.name} - ${item.color} x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}%0A`;
    });
    
    message += `%0A*TOTAL: R$ ${orderData.total.toFixed(2)}*%0A`;
    message += `*Pagamento: PIX*`;
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${state.whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    // Limpar carrinho
    state.cart = [];
    updateCartUI();
    elements.checkoutModal.classList.add('hidden');
    
    alert('Pedido enviado com sucesso! Você será redirecionado para o WhatsApp.');
}

// Autenticação Admin
async function handleAdminLogin(e) {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        elements.adminLoginModal.classList.add('hidden');
    } catch (error) {
        alert('Erro no login: ' + error.message);
    }
}

async function handleAdminLogout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

function checkAuthState() {
    auth.onAuthStateChanged(user => {
        state.currentUser = user;
        if (user) {
            showAdminPanel();
        } else {
            hideAdminPanel();
        }
    });
}

function showAdminPanel() {
    elements.adminPanel.classList.remove('hidden');
    loadAdminData();
}

function hideAdminPanel() {
    elements.adminPanel.classList.add('hidden');
}

// Carregar dados para o painel admin
async function loadAdminData() {
    await loadProductsForAdmin();
    setupAdminEventListeners();
}

// ... (continua com as funções do painel admin)

// Esta é uma versão resumida. O código completo teria todas as funcionalidades do painel admin,
// gerenciamento de estoque em tempo real, etc.

console.log('E-commerce Hellen Moda Fitness carregado!');
