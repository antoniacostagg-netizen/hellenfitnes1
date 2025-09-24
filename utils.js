// Utilitários para o e-commerce

// Gerenciamento do Carrinho no Firebase (opcional)
async function syncCartWithFirebase() {
    if (!state.currentUser) return;
    
    try {
        // Salvar carrinho no Firebase para persistência
        const userCartRef = db.collection('userCarts').doc(state.currentUser.uid);
        await userCartRef.set({
            cart: state.cart,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao sincronizar carrinho:', error);
    }
}

// Carregar carrinho salvo
async function loadSavedCart() {
    if (!state.currentUser) return;
    
    try {
        const userCartRef = db.collection('userCarts').doc(state.currentUser.uid);
        const doc = await userCartRef.get();
        
        if (doc.exists) {
            const cartData = doc.data();
            state.cart = cartData.cart || [];
            updateCartUI();
        }
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
    }
}

// Validar estoque antes de adicionar ao carrinho
function checkStockBeforeAdd(productId, colorName, quantity) {
    const product = state.products.find(p => p.id === productId);
    if (!product || !product.colors || !product.colors[colorName]) return false;
    
    const availableStock = product.colors[colorName].stock;
    const currentInCart = state.cart
        .filter(item => item.productId === productId && item.color === colorName)
        .reduce((sum, item) => sum + item.quantity, 0);
    
    return (currentInCart + quantity) <= availableStock;
}

// Reduzir estoque temporariamente (quando adiciona ao carrinho)
async function reserveStock(productId, colorName, quantity) {
    try {
        const productRef = productsRef.doc(productId);
        await productRef.update({
            [`colors.${colorName}.reserved`]: firebase.firestore.FieldValue.increment(quantity)
        });
    } catch (error) {
        console.error('Erro ao reservar estoque:', error);
    }
}

// Liberar estoque reservado (quando remove do carrinho ou finaliza compra)
async function releaseReservedStock(productId, colorName, quantity) {
    try {
        const productRef = productsRef.doc(productId);
        await productRef.update({
            [`colors.${colorName}.reserved`]: firebase.firestore.FieldValue.increment(-quantity)
        });
    } catch (error) {
        console.error('Erro ao liberar estoque:', error);
    }
}

// Calcular estoque disponível real
function getAvailableStock(productId, colorName) {
    const product = state.products.find(p => p.id === productId);
    if (!product || !product.colors || !product.colors[colorName]) return 0;
    
    const totalStock = product.colors[colorName].stock;
    const reserved = product.colors[colorName].reserved || 0;
    
    return Math.max(0, totalStock - reserved);
}

// Formatar moeda brasileira
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Validar CEP
async function validateCEP(cep) {
    cep = cep.replace(/\D/g, '');
    if (cep.length !== 8) return false;
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        return !data.erro;
    } catch (error) {
        console.error('Erro ao validar CEP:', error);
        return false;
    }
}

// Debounce para pesquisas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filtro de produtos por categoria
function filterProductsByCategory(category) {
    if (category === 'all') {
        displayProducts(state.products);
    } else {
        const filteredProducts = state.products.filter(product => 
            product.category === category
        );
        displayProducts(filteredProducts);
    }
}

// Pesquisa de produtos
const searchProducts = debounce((searchTerm) => {
    const filteredProducts = state.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayProducts(filteredProducts);
}, 300);

// Sistema de favoritos (opcional)
function toggleFavorite(productId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId);
    } else {
        favorites.push(productId);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesUI();
}

// Animação de adição ao carrinho
function animateAddToCart(button) {
    button.style.transform = 'scale(0.9)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
}

// Loading states
function showLoading() {
    document.body.style.opacity = '0.7';
    document.body.style.pointerEvents = 'none';
}

function hideLoading() {
    document.body.style.opacity = '1';
    document.body.style.pointerEvents = 'auto';
}

// Error handling global
window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
    showNotification('Ocorreu um erro inesperado. Por favor, recarregue a página.', 'error');
});

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
