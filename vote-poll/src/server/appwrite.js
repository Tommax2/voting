import { Client, Databases, Account, Query } from 'appwrite';
const client = new Client();
const DB_ID = "687be6170031b7b5f967";
const COLLECTION_ID = "687be633002c24ecd228";
const USER_VOTES_COLLECTION_ID ="user-votes"

client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('687be4cc002465727795');

export const databases = new Databases(client);
export const account = new Account(client);
export { client, DB_ID, COLLECTION_ID, Query, USER_VOTES_COLLECTION_ID };
