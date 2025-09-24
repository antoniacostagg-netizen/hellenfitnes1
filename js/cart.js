// Carrinho em memória (será persistido no Firestore posteriormente)
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Adicionar item ao carrinho
function addToCart(product, color, quantity) {
    // Verificar se o item já está no carrinho
    const existingItemIndex = cart.findIndex(item => 
        item.productId === product.id && item.color === color
    );
    
    if (existingItemIndex > -1) {
        // Atualizar quantidade se o item já existe
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Adicionar novo item
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            color: color,
            quantity: quantity,
            image: product.images[0]
        });
    }
    
    // Atualizar localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Atualizar exibição do carrinho
    updateCartDisplay();
    
    // Reduzir estoque temporariamente (será revertido se não finalizar)
    reserveStock(product.id, color, quantity);
}

// Remover item do carrinho
function removeFromCart(productId, color) {
    cart = cart.filter(item => !(item.productId === productId && item.color === color));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    
    // Liberar estoque reservado
    releaseStock(productId, color);
}

// Atualizar quantidade no carrinho
function updateCartQuantity(productId, color, newQuantity) {
    const itemIndex = cart.findIndex(item => 
        item.productId === productId && item.color === color
    );
    
    if (itemIndex > -1) {
        const oldQuantity = cart[itemIndex].quantity;
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        
        // Ajustar estoque reservado
        adjustReservedStock(productId, color, newQuantity - oldQuantity);
    }
}

// Calcular total do carrinho
function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Contar total de peças no carrinho
function countTotalItems() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const floatingBtn = document.getElementById('floating-checkout-btn');
    
    if (cart.length === 0) {
        cartItemsElement.innerHTML = '<p>Seu carrinho está vazio</p>';
        cartTotalElement.textContent = '0.00';
        floatingBtn.classList.remove('active');
    } else {
        cartItemsElement.innerHTML = '';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-color">Cor: ${item.color}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-product="${item.productId}" data-color="${item.color}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-product="${item.productId}" data-color="${item.color}">+</button>
                        <button class="remove-item" data-product="${item.productId}" data-color="${item.color}">🗑️</button>
                    </div>
                </div>
                <div class="cart-item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
            `;
            cartItemsElement.appendChild(itemElement);
        });
        
        cartTotalElement.textContent = calculateCartTotal().toFixed(2);
        floatingBtn.classList.add('active');
    }
    
    // Atualizar botão de finalizar compra
    updateCheckoutButton();
}

// Reservar estoque (temporário)
function reserveStock(productId, color, quantity) {
    // Esta função seria implementada com o Firestore para reservar estoque
    // Por enquanto, apenas em memória
    console.log(`Reservando ${quantity} unidades do produto ${productId}, cor ${color}`);
}

// Liberar estoque reservado
function releaseStock(productId, color) {
    // Esta função seria implementada com o Firestore para liberar estoque
    console.log(`Liberando estoque do produto ${productId}, cor ${color}`);
}

// Ajustar estoque reservado
function adjustReservedStock(productId, color, quantityChange) {
    // Esta função seria implementada com o Firestore para ajustar estoque
    console.log(`Ajustando estoque do produto ${productId}, cor ${color} em ${quantityChange} unidades`);
}

// Atualizar botão de finalizar compra
function updateCheckoutButton() {
    const totalItems = countTotalItems();
    const minOrderWarning = document.getElementById('min-order-warning');
    const submitBtn = document.getElementById('submit-order-btn');
    
    if (totalItems < 10) {
        minOrderWarning.style.display = 'block';
        submitBtn.disabled = true;
    } else {
        minOrderWarning.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Limpar carrinho após finalização
function clearCart() {
    cart = [];
    localStorage.removeItem('cart');
    updateCartDisplay();
}
