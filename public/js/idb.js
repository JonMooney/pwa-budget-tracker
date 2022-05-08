// Variable to hold db connection
let db;
// Connection to IndexedDB database, version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called 'budget', set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('expenses', { autoIncrement: true });
  };


// Success
request.onsuccess = function(event) {
    // when db is successfully created, save reference to db in global variable
    db = event.target.result;
  
    // If app is online, run uploadExpenses() function to send all local db data to api
    if (navigator.onLine) {
      // we haven't created this yet, but we will soon, so let's comment it out for now
      // uploadExpenses();
    }
};

// Error
request.onerror = function(event) {
    console.log(event.target.errorCode);
};


// Function when no internet connection
function saveRecord(record) {
    // Open a new transaction with the DB with read and write permissions 
    const transaction = db.transaction(['expenses'], 'readwrite');
  
    // Access 'expenses' object store
    const expensesObjectStore = transaction.objectStore('expenses');
  
    // Add record to store
    expensesObjectStore.add(record);
}

function uploadExpenses() {
    // open a transaction on your db
    const transaction = db.transaction(['expenses'], 'readwrite');
  
    // access your object store
    const expensesObjectStore = transaction.objectStore('expenses');
  
    // get all records from store and set to a variable
    const getAll = expensesObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
        fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(serverResponse => {
            if (serverResponse.message) {
                throw new Error(serverResponse);
            }
            // open one more transaction
            const transaction = db.transaction(['expenses'], 'readwrite');
            // access the new_pizza object store
            const pizzaObjectStore = transaction.objectStore('expenses');
            // clear all items in your store
            pizzaObjectStore.clear();

            alert('All expenses have been submitted!');
            })
            .catch(err => {
            console.log(err);
            });
        }
    };
  }

  window.addEventListener('online', uploadExpenses);