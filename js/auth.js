// Verificar se o usuário está logado (para o painel admin)
function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(user);
            } else {
                reject(new Error('Usuário não autenticado'));
            }
        });
    });
}

// Fazer login
function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Fazer logout
function logout() {
    return auth.signOut();
}

// Verificar se há um usuário logado
function getCurrentUser() {
    return auth.currentUser;
}
