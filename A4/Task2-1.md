This is a Python program that defines the `load_csv_from_blob` function to load CSV data from Azure Blob Storage into a pandas DataFrame using Azure SDK and pandas. The function takes Azure Storage credentials, container name, and blob name as arguments. It establishes a connection to the blob storage using the context manager, parses the blobs in the specified container, applies pagination to process large CSV files (over 100MB) by reading them piece by piece, and merges these pieces into a single DataFrame. The main function prompts the user for Azure Storage credentials and information about the blob, loads the CSV data using `load_csv_from_blob`, and displays the DataFrame or an error message. The program may give an error that the local variable `dataframe_aggregate` is referenced before the assignment. Can you take a look at the code and troubleshoot the problems?

```python
from azure.storage.blob import BlobServiceClient, BlobClient
from azure.core.exceptions import ResourceNotFoundError
import pandas as pd
from io import StringIO

def load_csv_from_blob(storage_account_name, storage_account_key, container_name, blob_name, encoding='utf-8'):
    """
    Load CSV data from Azure Blob Storage.

    Parameters:
    - storage_account_name (str): Azure Storage account name.
    - storage_account_key (str): Azure Storage account key.
    - container_name (str): Name of the container in Azure Blob Storage.
    - blob_name (str): Name of the CSV blob file.
    - encoding (str): Encoding of the CSV file. Default is 'utf-8'.

    Returns:
    - DataFrame: Concatenated DataFrame from all chunks of the CSV file.
    """
    try:
        # Establish connection to Azure Blob Storage.
        blob_service_client = BlobServiceClient(account_url=f"https://{storage_account_name}.blob.core.windows.net",
                                                credential=storage_account_key)

        # Retrieve blob data.
        paginator = blob_service_client.get_container_client(container_name).list_blobs(name_starts_with=blob_name)
        dataframe_chunks = []
        for blob in paginator:
            blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob.name)
            blob_data = blob_client.download_blob().readall()
            # Load CSV data, handling large files in chunks.
            if len(blob_data) > 100 * 1024 * 1024:
                for df_chunk in pd.read_csv(StringIO(blob_data.decode(encoding)), chunksize=10**6):
                    dataframe_chunks.append(df_chunk)
            else:
                dataframe_chunks.append(pd.read_csv(StringIO(blob_data.decode(encoding))))

        # Concatenate chunks into a single DataFrame.
        dataframe_aggregate = pd.concat(dataframe_chunks, ignore_index=True)
        return dataframe_aggregate

    except ResourceNotFoundError:
        print("Blob not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
    return dataframe_aggregate


def main():
    """
    Main function to load CSV data from Azure Blob Storage and display it.
    """
    try:
        # Prompt user for Azure Blob Storage credentials.
        storage_account_name = input("Enter your Azure Storage account name: ")
        storage_account_key = input("Enter your Azure Storage account key: ")
        container_name = input("Enter the name of the container: ")
        blob_name = input("Enter the name of the blob (CSV file): ")

        # Load CSV data from Azure Blob Storage.
        df = load_csv_from_blob(storage_account_name, storage_account_key, container_name, blob_name)
        if df is not None:
            print("DataFrame loaded successfully:")
            print(df.head())
        else:
            print("Failed to load DataFrame from Azure Blob Storage.")

    except KeyboardInterrupt:
        print("Operation interrupted by user.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
