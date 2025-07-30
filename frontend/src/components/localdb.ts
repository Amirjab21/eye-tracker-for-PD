// db.ts
import { openDB } from 'idb';

export const dbPromise = openDB('health-measurements-db', 1, {
  upgrade(db) {
    db.createObjectStore('measurements', { keyPath: 'timestamp_ms' });
  },
});

export async function saveMeasurementLocally(data: any) {
  const db = await dbPromise;
  await db.put('measurements', data);
}

export async function getAllMeasurements() {
  const db = await dbPromise;
  return await db.getAll('measurements');
}

export async function deleteMeasurement(timestamp: number) {
  const db = await dbPromise;
  await db.delete('measurements', timestamp);
}

export async function deleteMeasurementsInRange(startTime: number, endTime: number) {
    const db = await openDB('health-measurements-db', 1);
    const tx = db.transaction('measurements', 'readwrite');
    const store = tx.objectStore('measurements');
  
    // Inclusive start, exclusive end
    const range = IDBKeyRange.bound(startTime, endTime, false, false);
  
    let cursor = await store.openCursor(range);
  
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
  
    await tx.done;
  }

  const deleteDatabase = async (dbName: string) => {
    console.log('deleting database', dbName)
    const request = indexedDB.deleteDatabase(dbName);
  
    request.onsuccess = function() {
      console.log(`Database ${dbName} deleted successfully`);
    };
  
    request.onerror = function(event) {
      console.error(`Error deleting database ${dbName}:`, event.target.error);
    };
  
    request.onblocked = function() {
      console.warn(`Delete blocked for database ${dbName}`);
    };
  };
  
  // Call the function with your database name
//   deleteDatabase('health-measurements-db');