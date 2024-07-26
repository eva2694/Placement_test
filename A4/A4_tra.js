const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const Papa = require('papaparse');
const readline = require('readline');

/**
 * Load CSV data from Azure Blob Storage.
 * 
 * @param {string} storageAccountName - Azure Storage account name.
 * @param {string} storageAccountKey - Azure Storage account key.
 * @param {string} containerName - Name of the container in Azure Blob Storage.
 * @param {string} blobName - Name of the CSV blob file.
 * @param {string} [encoding='utf-8'] - Encoding of the CSV file. Default is 'utf-8'.
 * @returns {Promise<Array<Object>>} - Concatenated DataFrame from all chunks of the CSV file.
 */
async function loadCsvFromBlob(storageAccountName, storageAccountKey, containerName, blobName, encoding = 'utf-8') {
    try {
        // Establish connection to Azure Blob Storage
        const credentials = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
        const blobServiceClient = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net`, credentials);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Retrieve blob data
        let dataframeChunks = [];
        for await (const blob of containerClient.listBlobsFlat({ prefix: blobName })) {
            const blobClient = containerClient.getBlobClient(blob.name);
            const downloadBlockBlobResponse = await blobClient.download(0);
            const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);

            // Parse CSV data
            if (downloaded.length > 100 * 1024 * 1024) {
                Papa.parse(downloaded, {
                    header: true,
                    skipEmptyLines: true,
                    chunkSize: 10**6,
                    chunk: function (results) {
                        dataframeChunks.push(results.data);
                    }
                });
            } else {
                Papa.parse(downloaded, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        dataframeChunks.push(results.data);
                    }
                });
            }
        }

        // Concatenate chunks into a single DataFrame (array of objects in JS)
        const dataframeAggregate = dataframeChunks.flat();
        return dataframeAggregate;

    } catch (error) {
        if (error.statusCode === 404) {
            console.log("Blob not found.");
        } else {
            console.log(`An error occurred: ${error.message}`);
        }
        return null;
    }
}

// Helper function to convert readable stream to string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}

/**
 * Main function to load CSV data from Azure Blob Storage and display it.
 */
async function main() {
    try {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        // Prompt user for Azure Blob Storage credentials.
        const question = (query) => new Promise((resolve) => rl.question(query, resolve));

        const storageAccountName = await question("Enter your Azure Storage account name: ");
        const storageAccountKey = await question("Enter your Azure Storage account key: ");
        const containerName = await question("Enter the name of the container: ");
        const blobName = await question("Enter the name of the blob (CSV file): ");

        rl.close();
        // Load CSV data from Azure Blob Storage.
        const df = await loadCsvFromBlob(storageAccountName, storageAccountKey, containerName, blobName);
        if (df) {
            console.log("DataFrame loaded successfully:");
            console.log(df.slice(0, 5)); 
        } else {
            console.log("Failed to load DataFrame from Azure Blob Storage.");
        }

    } catch (error) {
        console.log(`An error occurred: ${error.message}`);
    }
}

main();
