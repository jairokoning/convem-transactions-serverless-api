import dotenv from 'dotenv';
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import express from "express";
import cors from "cors";
import serverless from "serverless-http";
dotenv.config();
const app = express();
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE;

const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1'});

app.use(express.json());
app.use(cors());

app.get("/transactions", async (req, res) => {
  const lastEvaluatedKey = req.query.lastEvaluatedKey;
  const params = {
    TableName: TRANSACTIONS_TABLE,
    Limit: 100,
  };

  try {
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = {
        "idempotencyId": {
          "S": lastEvaluatedKey
        }
      };
    }
    const { Items, LastEvaluatedKey, Count } = await dynamoDbClient.send(new ScanCommand(params));
    return res.json({Items, LastEvaluatedKey, Count });
    // if (Items.length > 0) {      
    //   return res.json({Items, LastEvaluatedKey, Count });
    // } else {
    //   return res
    //     .status(200)
    //     .json([]);
    // }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not retreive transactions" });
  }
});

app.post("/transactions", async (req, res) => {
  const { idempotencyId, amount, type } = req.body;

  const params = {
    TableName: TRANSACTIONS_TABLE,
    Item: {
      idempotencyId, amount, type
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    return res.status(201);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not create transaction" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

export const handler = serverless(app);
