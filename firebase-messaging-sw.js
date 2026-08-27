importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCBzGa8dUJRTsOI15cClllCsRWnhiGTN_c",
  authDomain: "hub-menche.firebaseapp.com",
  projectId: "hub-menche",
  storageBucket: "hub-menche.firebasestorage.app",
  messagingSenderId: "541406471380",
  appId: "1:541406471380:web:7a748c7f84d2ef930a8741"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Mensagem recebida:", payload);

  const notificationTitle =
    payload.notification?.title || "Menchë Interiores";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "Você recebeu uma nova mensagem no Hub.",
    icon: "/favicon.ico",
    data: payload.data || {}
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});
