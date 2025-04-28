// firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyApsw1fjL5l9_w8nKDPcqAXfpYA0DrvdD8",
    authDomain: "ritualos-tuna-game.firebaseapp.com",
    databaseURL: "https://ritualos-tuna-game-default-rtdb.firebaseio.com",
    projectId: "ritualos-tuna-game",
    storageBucket: "ritualos-tuna-game.appspot.com",
    messagingSenderId: "822681978464",
    appId: "1:822681978464:web:65c71f6f6dfc510f0ee505",
    measurementId: "G-KY7YFERX5Q"
  };
  
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const database = firebase.database(app);
  const analytics = firebase.analytics ? firebase.analytics(app) : null;
  