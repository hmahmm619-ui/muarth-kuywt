import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFEf9ZkDkCi7AEXPJ8z_AFsX4pTiPv7Vo",
  authDomain: "esfgdr.firebaseapp.com",
  databaseURL: "https://esfgdr-default-rtdb.firebaseio.com",
  projectId: "esfgdr",
  storageBucket: "esfgdr.firebasestorage.app",
  messagingSenderId: "479566323800",
  appId: "1:479566323800:web:72bcd20412cd0c5b61ea2d",
  measurementId: "G-GMSB6TBP94"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debug() {
  console.log("Listing all sessions in 'sessions' collection...");
  const sessionsSnapshot = await getDocs(collection(db, "sessions"));
  const sessionIds = new Set();
  sessionsSnapshot.forEach(doc => {
    sessionIds.add(doc.id);
    console.log(`Session: ${doc.id} | Last Activity: ${doc.data().lastActivity?.toDate?.() || doc.data().lastActivity}`);
  });

  console.log("\nListing all steps in 'bookings_steps' collection...");
  const stepsSnapshot = await getDocs(collection(db, "bookings_steps"));
  stepsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Step: ${data.step} | Session: ${data.sessionId} | Doc ID: ${doc.id}`);
    if (data.data && JSON.stringify(data.data).includes("4444")) {
      console.log("!!! FOUND CARD DATA !!!");
      console.log(JSON.stringify(data.data, null, 2));
    }
  });

  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
