import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// COLOQUE SUAS CHAVES AQUI:
const firebaseConfig = {
  apiKey: "AIzaSyA0rxNDLd-_ryk2AMN4QxaWRx9JBn9xkD0",
  authDomain: "catalogo-site-5d8d7.firebaseapp.com",
  projectId: "catalogo-site-5d8d7",
  storageBucket: "catalogo-site-5d8d7.firebasestorage.app",
  messagingSenderId: "844819235003",
  appId: "1:844819235003:web:b7e50f49d4c576a5e0e99e",
  measurementId: "G-YGRR3YNQQM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const STATE = {
  arts: [],
  categories: { products: [], themes: [], occasions: [] }
};

// ==========================================
// CONTROLE DE NAVEGAÇÃO E AUTENTICAÇÃO
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('appLayout').classList.remove('hidden');
        loadAllData();
    } else {
        document.getElementById('loginOverlay').classList.remove('hidden');
        document.getElementById('appLayout').classList.add('hidden');
    }
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;
    if(!email || !pass) return alert("Preencha tudo.");
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Acesso Negado.");
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
        e.currentTarget.classList.add('active');
        document.getElementById(e.currentTarget.dataset.target).classList.remove('hidden');
        document.getElementById('pageTitle').textContent = e.currentTarget.textContent;
    });
});

// ==========================================
// CARREGAR DADOS E CALCULAR ESPAÇO
// ==========================================
async function loadAllData() {
    // Carregar Categorias
    const docRef = doc(db, "configuracoes", "categorias");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        STATE.categories = docSnap.data();
    } else {
        await setDoc(docRef, STATE.categories);
    }
    renderCategories();
    updateSelects();

    // Carregar Artes e Calcular Gigas
    const querySnapshot = await getDocs(collection(db, "artes"));
    STATE.arts = [];
    let totalBytes = 0;

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        STATE.arts.push({ id: doc.id, ...data });
        if(data.sizeBytes) totalBytes += data.sizeBytes;
    });

    renderArtsTable(STATE.arts);
    
    // Atualizar Dashboard
    document.getElementById('metricArtsCount').textContent = STATE.arts.length;
    document.getElementById('metricGroupsCount').textContent = STATE.categories.themes.length;
    
    // Matemática do Armazenamento (Calcula MB e % de 5GB)
    const megabytes = (totalBytes / (1024 * 1024)).toFixed(2);
    const maxGB = 5 * 1024; // 5GB em MB
    const percent = (megabytes / maxGB) * 100;
    
    document.getElementById('metricStorageCount').textContent = `${megabytes} MB`;
    document.getElementById('storageFill').style.width = `${percent}%`;
}

// ==========================================
// GERENCIAR CATEGORIAS (CONFIGURAÇÃO)
// ==========================================
window.addCategory = async (type, inputId) => {
    const val = document.getElementById(inputId).value.trim();
    if(!val) return;
    if(!STATE.categories[type]) STATE.categories[type] = [];
    STATE.categories[type].push(val);
    
    await setDoc(doc(db, "configuracoes", "categorias"), STATE.categories);
    document.getElementById(inputId).value = '';
    loadAllData();
    showToast("Adicionado com sucesso!");
};

window.removeCategory = async (type, index) => {
    if(!confirm("Remover este item?")) return;
    STATE.categories[type].splice(index, 1);
    await setDoc(doc(db, "configuracoes", "categorias"), STATE.categories);
    loadAllData();
    showToast("Removido!");
};

function renderCategories() {
    const renderList = (type, listId) => {
        const ul = document.getElementById(listId);
        ul.innerHTML = '';
        (STATE.categories[type] || []).forEach((item, index) => {
            ul.innerHTML += `<li>${item} <button class="btn-danger-sm" onclick="removeCategory('${type}', ${index})"><i class="fa-solid fa-trash"></i></button></li>`;
        });
    };
    renderList('products', 'productsList');
    renderList('themes', 'themesList');
    renderList('occasions', 'occasionsList');
}

function updateSelects() {
    const fill = (selectId, type) => {
        const select = document.getElementById(selectId);
        const currentVal = select.value;
        select.innerHTML = '<option value="">Selecione...</option>';
        (STATE.categories[type] || []).forEach(opt => select.innerHTML += `<option value="${opt}">${opt}</option>`);
        select.value = currentVal;
    };
    fill('productSelect', 'products');
    fill('themeSelect', 'themes');
    fill('occasionSelect', 'occasions');
}

// ==========================================
// GERENCIAR ARTES (CRUD)
// ==========================================
document.getElementById('btnNewArt').addEventListener('click', () => {
    document.getElementById('artForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('modalArtTitle').textContent = 'Cadastrar Nova Arte';
    document.getElementById('artModal').showModal();
});

document.getElementById('closeArtModal').addEventListener('click', () => document.getElementById('artModal').close());
document.getElementById('cancelArtBtn').addEventListener('click', () => document.getElementById('artModal').close());

document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('artForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveArtBtn');
    btn.textContent = 'Salvando...';
    btn.disabled = true;

    try {
        let imageUrl = "";
        let sizeBytes = 0;
        const file = document.getElementById('imageInput').files[0];

        if (file) {
            sizeBytes = file.size; // Pega o tamanho do arquivo
            const storageRef = ref(storage, `artes/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(storageRef);
        }

        const id = document.getElementById('editId').value;
        const artData = {
            title: document.getElementById('titleInput').value.trim(),
            code: document.getElementById('codeInput').value.trim().toUpperCase(),
            product: document.getElementById('productSelect').value,
            theme: document.getElementById('themeSelect').value,
            occasion: document.getElementById('occasionSelect').value,
            style: document.getElementById('styleInput').value.trim(),
            tags: document.getElementById('tagsInput').value.trim(),
        };

        if (id) {
            if (imageUrl) {
                artData.image = imageUrl;
                artData.sizeBytes = sizeBytes; // Atualiza o tamanho se upar nova foto
            }
            await updateDoc(doc(db, "artes", id), artData);
            showToast("Arte atualizada!");
        } else {
            if (!imageUrl) throw new Error("Selecione uma imagem!");
            artData.image = imageUrl;
            artData.sizeBytes = sizeBytes; // Salva o tamanho da foto no banco para o contador
            await addDoc(collection(db, "artes"), artData);
            showToast("Arte cadastrada!");
        }

        document.getElementById('artModal').close();
        loadAllData();
    } catch (err) {
        alert("Erro: " + err.message);
    } finally {
        btn.textContent = 'Salvar Arte';
        btn.disabled = false;
    }
});

window.editArtAdmin = (id) => {
    const art = STATE.arts.find(a => a.id === id);
    if(!art) return;
    document.getElementById('editId').value = art.id;
    document.getElementById('titleInput').value = art.title;
    document.getElementById('codeInput').value = art.code;
    document.getElementById('productSelect').value = art.product;
    document.getElementById('themeSelect').value = art.theme;
    document.getElementById('occasionSelect').value = art.occasion || '';
    document.getElementById('styleInput').value = art.style;
    document.getElementById('tagsInput').value = art.tags;
    
    document.getElementById('imagePreview').src = art.image;
    document.getElementById('imagePreview').classList.remove('hidden');
    
    document.getElementById('modalArtTitle').textContent = 'Editar Arte';
    document.getElementById('artModal').showModal();
};

window.deleteArtAdmin = async (id) => {
    if(!confirm("Apagar definitivamente esta arte?")) return;
    try {
        await deleteDoc(doc(db, "artes", id));
        loadAllData();
        showToast("Arte excluída!");
    } catch(e) {
        alert("Erro ao apagar.");
    }
};

function renderArtsTable(artsArray) {
    const tbody = document.getElementById('artsTableBody');
    tbody.innerHTML = '';
    artsArray.forEach(art => {
        // Converte o tamanho da imagem para KB para exibir na tabela
        const sizeKB = art.sizeBytes ? (art.sizeBytes / 1024).toFixed(1) + ' KB' : 'N/D';
        
        tbody.innerHTML += `
            <tr>
                <td><img src="${art.image}" class="art-thumb"></td>
                <td><strong>${art.code}</strong></td>
                <td>${art.title}</td>
                <td><span class="badge">${art.product}</span></td>
                <td>${art.theme}</td>
                <td style="color: #64748b; font-size: 0.8rem;">${sizeKB}</td>
                <td>
                    <button class="btn-edit-sm" onclick="editArtAdmin('${art.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-danger-sm" onclick="deleteArtAdmin('${art.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

document.getElementById('searchArtAdmin').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = STATE.arts.filter(a => a.title.toLowerCase().includes(term) || a.code.toLowerCase().includes(term));
    renderArtsTable(filtered);
});

function showToast(msg) {
    document.getElementById('toastMsg').textContent = msg;
    const toast = document.getElementById('toast');
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}