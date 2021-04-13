// creates new request for "budget" db
const request = indexedDB.open("budget", 1);
let db;

request.onupgradeneeded = (event) => {
  // creates objectStore "pending" and sets to autoIncrement
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onerror = (event) => {
  console.log("Uh-oh! " + event.target.errorCode);
};

request.onsuccess = (event) => {
  db = event.target.result;

  // confirms whether app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

function saveRecord(record) {
  // creates transaction on pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // accesses pending objectStore
  const store = transaction.objectStore("pending");

  // add record to store
  store.add(record);
}

function checkDatabase() {
  console.log("checking db...");
  // opens transaction on pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // accesses pending objectStore
  const store = transaction.objectStore("pending");
  // getAll records from store and set to variable
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // onsuccess, open a transaction on pending db
          const transaction = db.transaction(["pending"], "readwrite");

          // accesses pending objectStore
          const store = transaction.objectStore("pending");

          // clear all items in store
          store.clear();
        });
    }
  };
}

// listens for app coming back online
window.addEventListener("online", checkDatabase);
