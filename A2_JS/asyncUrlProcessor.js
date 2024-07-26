/**
 * Asynchronous generator function that processes a list of URLs by fetching and parsing JSON data from each URL.
 *
 * @param {string[]} urls - An array of URLs to be fetched and processed.
 * @yields {Object} - Parsed JSON data from each URL.
 *
 * @example
 * // Logs the URL respones to the console
 * const urls = ['https://example.i/1', 'https://example.i/2'];
 * for await (const data of asyncUrlProcessor(urls)) {
 *   console.log(data);
 * }
 */
async function* asyncUrlProcessor(urls) {
    for (const url of urls) {
      // Fetching the response from the URL
      const response = await fetch(url);
      // Parsing the response as JSON
      const data = await response.json();
      // Yielding the parsed JSON data
      yield data;
    }
  }
  
  module.exports = { asyncUrlProcessor };
