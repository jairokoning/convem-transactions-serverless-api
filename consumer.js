// index.js (função Lambda)
import dotenv from 'dotenv';
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

dotenv.config()
const dynamoDB = new DynamoDBClient({ region: 'us-east-1'});
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE;

exports.consumer = async (event) => {
  try {
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      await saveTransaction(message);
    }

    const responseHeaders = {
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Credentials': true,
    };
    
    return { 
      statusCode: 200, 
      body: 'Transactions processed successfully',
      headers: responseHeaders
    };
  } catch (error) {
    console.error('Error processing transactions:', error);
    return { statusCode: 500, body: 'Failed to process transactions' };
  }
};

const saveTransaction = async (transaction) => {
  const params = {
    TableName: TRANSACTIONS_TABLE,
    Item: {
      idempotencyId: { S: transaction.idempotencyId },
      amount: { N: transaction.amount.toString() },
      type: { S: transaction.type },
    },
  };

  await dynamoDB.send(new PutItemCommand(params));
};
