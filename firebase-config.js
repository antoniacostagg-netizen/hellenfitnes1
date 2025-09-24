// Configuração do Firebase - DADOS FORNECIDOS
const firebaseConfig = {
    apiKey: "AIzaSyAn5SPhZJPqR6IdQecnFnMwLdDm3efy4ko",
    authDomain: "hellen-moda-fitnes.firebaseapp.com",
    projectId: "hellen-moda-fitnes",
    storageBucket: "hellen-moda-fitnes.firebasestorage.app",
    messagingSenderId: "998940228851",
    appId: "1:998940228851:web:d4e8d3ac366c26fe9e4b86"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Referências das coleções
const productsRef = db.collection('products');
const settingsRef = db.collection('settings').doc('siteSettings');
const cartRef = db.collection('cart');
const stockRef = db.collection('stock');
