const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const Papa = require('papaparse');
const readline = require('readline');

async function loadCsvFromBlob(storageAccountName, storageAccountKey, containerName, blobName, encoding = 'utf-8') {
    try {
        const credentials = new StorageSharedKeyCredential(storageAccountName, storageAccountKey);
        const blobServiceClient = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net`, credentials);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        let dataframeChunks = [];
        for await (const blob of containerClient.listBlobsFlat({ prefix: blobName })) {
            const blobClient = containerClient.getBlobClient(blob.name);
            const downloadBlockBlobResponse = await blobClient.download(0);
            const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);

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

async function main() {
    try {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (query) => new Promise((resolve) => rl.question(query, resolve));

        const storageAccountName = await question("Enter your Azure Storage account name: ");
        const storageAccountKey = await question("Enter your Azure Storage account key: ");
        const containerName = await question("Enter the name of the container: ");
        const blobName = await question("Enter the name of the blob (CSV file): ");

        rl.close();

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

//main();


async function runTestCases() {
    let storageAccountName;
    let storageAccountKey;
    let containerName;
    let blobName;
    let df;

    console.log("t1");
    storageAccountName = 'e2424';
    storageAccountKey = 'bwWTk+j6QsvGC6fGi5Yk1d7J0NyoObVaaOeY9+***';
    containerName = 'e2424';
    blobName = 'test.csv';
    df = await loadCsvFromBlob(storageAccountName, storageAccountKey, containerName, blobName);
    //console.log("Loaded DataFrame:", df);
    console.assert(df !== null, "DataFrame is None.");
    const expectedRows = 4;
    const expectedColumns = 1;
    console.assert(df.length === expectedRows && Object.keys(df[0]).length === expectedColumns, `DataFrame shape mismatch: ${df.length}x${Object.keys(df[0]).length}`);

    console.log("t2");
    storageAccountName = 'e2424';
    storageAccountKey = 'bwWTk+j6QsvGC6fGi5Yk1d7J0NyoObVaaOeY9+***';
    containerName = 'e2424';
    blobName = 'nonexistent_blob.csv';
    df = await loadCsvFromBlob(storageAccountName, storageAccountKey, containerName, blobName);
    console.assert(df === null, "DataFrame is not None when blob should not exist.");

    console.log("t3");
    storageAccountName = 'invalid_account_name';
    storageAccountKey = 'invalid_account_key';
    containerName = 'e2424';
    blobName = 'test.csv';
    df = await loadCsvFromBlob(storageAccountName, storageAccountKey, containerName, blobName);
    console.assert(df === null, "DataFrame is not None when credentials are invalid.");

    console.log("t4");
    storageAccountName = 'e2424';
    storageAccountKey = 'bwWTk+j6QsvGC6fGi5Yk1d7J0NyoObVaaOeY9+***';
    containerName = 'e2424';
    blobName = 'test_e.csv';
    df = await loadCsvFromBlob(storageAccountName, storageAccountKey, containerName, blobName);
    console.assert(df.length === 0, "DataFrame is not empty for an empty CSV file.");
}

runTestCases();

