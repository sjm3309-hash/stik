/* Auto-generated from .env.local. Do not edit directly. */
importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js");

firebase.initializeApp({
  "apiKey": "AIzaSyCZ5BmFRj8rz59vsNZwfetkQOtnBJHEkdg",
  "authDomain": "stik-4ea6a.firebaseapp.com",
  "projectId": "stik-4ea6a",
  "storageBucket": "stik-4ea6a.firebasestorage.app",
  "messagingSenderId": "32175780517",
  "appId": "1:32175780517:web:1000bf3a2f86655f86134c"
});

const messaging = firebase.messaging();

// VAPID key for token generation
const VAPID_KEY = "BBv8cwydP5umCyd3BSrSA4eFDpz8CZ_kK3oi8xFeUz7KxYAhg0cFA2wEPMqVhXRugkzZVlqEiwnht1oP9KOj4Ok";

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification ?? {};
  const title = notification.title ?? "Stik";
  const options = {
    body: notification.body ?? "",
    icon: notification.icon ?? "/next.svg",
    data: payload.data ?? {},
  };

  self.registration.showNotification(title, options);
});
