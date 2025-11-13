/**
 * testFetch.js
 *
 * This is a standalone script to test fetching and parsing data
 * from data.gov.in.
 *
 * Run it from your terminal: `node testFetch.js`
 */

// This is the direct JSON file URL from data.gov.in
const ODISHA_IPC_DATA_URL = 'https://data.gov.in/files/resource-json/district-wise-cases-reported-under-indian-penal-code-ipc-crimes-odisha-2012-2014.json';
import axios from 'axios';

/**
 * The data.gov.in API returns data in a raw format,
 * not as clean objects. This function fetches and cleans it.
 */
async function loadAndProcessData() {
  try {
    console.log(`[Test Fetch] Fetching data from ${ODISHA_IPC_DATA_URL}...`);
    
    // 1. Fetch the data
    // FINAL FIX: Add even more browser-like headers
    const response = await axios.get(ODISHA_IPC_DATA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://data.gov.in/' // <-- This is often the key
      }
    });
    
    // With axios, the data is directly on the `data` property.
    // No need for response.ok or response.json()
    const rawData = response.data;
    
    // 2. Process the headers
    // The 'fields' array tells us what each column is.
    // e.g., { "id": "field2", "label": "District" }
    const headers = rawData.fields.map(field => field.label);
    
    // 3. Process the data rows
    // The 'data' array is just an array of arrays, e.g., ["Angul", "2012", "54"]
    // We need to map this to an object using the headers.
    const cleanData = rawData.data.map(row => {
      const entry = {};
      headers.forEach((header, index) => {
        // Clean up the header name to be a good JSON key
        // "District" -> "district"
        // "Murder (Section 302 IPC)" -> "murder_section_302_ipc"
        const cleanKey = header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '');
        
        entry[cleanKey] = row[index];
      });
      return entry;
    });

    console.log(`[Test Fetch] Successfully fetched and processed ${cleanData.length} records.`);
    console.log("\n--- CLEAN, PROCESSED DATA (Sample) ---");
    // Log the first 3 records to see what it looks like
    console.log(cleanData.slice(0, 3));

    console.log("\n--- FULL DATA (First Record) ---");
    console.log(cleanData[0]);

  } catch (error) {
    console.error("[Test Fetch] Failed to fetch or process data:", error);
  }
}

// Run the function
loadAndProcessData();