import {Client, Databases } from 'appwrite';
const client = new Client();
const DB_ID = "687be6170031b7b5f967";
const COLLECTION_ID = "687be633002c24ecd228";

client
  .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite Endpoint
    .setProject('687be4cc002465727795') ;
        // Your Appwrite Project ID

export const databases = new Databases(client);
export { client, DB_ID, COLLECTION_ID };
