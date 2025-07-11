// kampalacars.js

// Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyBM_GjHzv5Z-1ZqbcCfnCySV_cFj2O5Rew",
    authDomain: "kampalacars.firebaseapp.com",
    projectId: "kampalacars",
    storageBucket: "kampalacars.appspot.com",
    messagingSenderId: "61614330009",
    appId: "1:61614330009:web:2f5d3e04b0b1117274e808"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  // ========== Auth ==========
  
  // Register
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
  
      try {
        await auth.createUserWithEmailAndPassword(email, password);
      
        alert('Registration successful!');
        window.location.href = 'dashboard.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }
  
  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
  
      try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('Login successful!');
        window.location.href = 'dashboard.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }
  
  // ========== Car Upload ==========
  const addCarForm = document.getElementById('add-car-form');
  if (addCarForm) {
    addCarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const file = e.target.elements[4].files[0];
      const storageRef = storage.ref(`car-images/${file.name}`);
      await storageRef.put(file);
      const imageUrl = await storageRef.getDownloadURL();
  
      const car = {
        make: e.target.elements[0].value,
        model: e.target.elements[1].value,
        year: parseInt(e.target.elements[2].value),
        price: parseFloat(e.target.elements[3].value),
        imageUrl,
        seller: auth.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
  
      try {
        await db.collection('cars').add(car);
        alert('Car added successfully!');
        e.target.reset();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }
  
  // ========== Car Details Page ==========
  async function loadCarDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;
  
    const container = document.getElementById('carDetails');
    if (!container) return;
  
    try {
      const doc = await db.collection('cars').doc(id).get();
      const car = doc.data();
  
      container.innerHTML = `
        <h2>${car.make} ${car.model} (${car.year})</h2>
        <img src="${car.imageUrl}" alt="${car.make}" style="width:100%; border-radius:8px;">
        <p><strong>Price:</strong> $${car.price}</p>
        <p><strong>Seller:</strong> ${car.seller}</p>
        <form id="contactForm" class="contact-form">
          <input type="text" id="name" placeholder="Your Name" required>
          <input type="email" id="email" placeholder="Your Email" required>
          <textarea id="message" placeholder="Your Message" required></textarea>
          <button type="submit">Contact Seller</button>
        </form>
      `;
  
      const contactForm = document.getElementById('contactForm');
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Message sent to seller successfully!');
        contactForm.reset();
      });
  
    } catch (err) {
      container.innerHTML = '<p>Error loading car details.</p>';
    }
  }
  
  // Load car details if on that page
  document.addEventListener('DOMContentLoaded', loadCarDetails);
  