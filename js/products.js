// Carregar produtos do Firestore
function loadProducts(category = 'all') {
    let query = productsRef.where('active', '==', true);
    
    if (category !== 'all') {
        query = query.where('category', '==', category);
    }
    
    return query.get().then(snapshot => {
        const products = [];
        snapshot.forEach(doc => {
            const product = doc.data();
            product.id = doc.id;
            products.push(product);
        });
        return products;
    });
}

// Carregar um produto específico
function loadProduct(productId) {
    return productsRef.doc(productId).get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            product.id = doc.id;
            return product;
        } else {
            throw new Error('Produto não encontrado');
        }
    });
}

// Atualizar estoque no Firestore
function updateStock(productId, color, quantity) {
    return productsRef.doc(productId).get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            const currentStock = product.stock[color] || 0;
            const newStock = Math.max(0, currentStock - quantity);
            
            // Atualizar apenas o estoque da cor específica
            const updateData = {};
            updateData[`stock.${color}`] = newStock;
            
            return productsRef.doc(productId).update(updateData);
        }
    });
}

// Verificar estoque disponível
function checkStock(productId, color, requestedQuantity) {
    return productsRef.doc(productId).get().then(doc => {
        if (doc.exists) {
            const product = doc.data();
            const availableStock = product.stock[color] || 0;
            return availableStock >= requestedQuantity;
        }
        return false;
    });
}
