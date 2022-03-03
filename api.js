const db = require("./db");
const {
    GetItemCommand,
    PutItemCommand,
    DeleteItemCommand,
    ScanCommand,
    UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const getStore = async (event) => {
    const response = { statusCode: 200 };

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ storeId: event.pathParameters.storeId }),
        };
        const { Item } = await db.send(new GetItemCommand(params));

        console.log({ Item });
        response.body = JSON.stringify({
            message: "Successfully retrieved store",
            data: (Item) ? unmarshall(Item) : {},
            rawData: Item,
        });
    } catch (error) {
        console.log(error);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to get store",
            errorMsg: error.message,
            errorStack: error.stack,
        })
    }

    return response;
};

const createStore = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(body || {}),
        };
        const createResult = await db.send(new PutItemCommand(params));

        response.body = JSON.stringify({
            message: "successfully created store",
            createResult,
        })
    } catch (error) {
        console.log(error);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to create store",
            errorMsg: error.message,
            errorStack: error.stack,

        });
    }

    return response;
}

const updateStore = async (event) => {
    const response = { statusCode: 200 };

    try {
        const body = JSON.parse(event.body);
        const objKeys = Object.keys(body);
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ storeId: event.pathParameters.storeId }),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: body[key],
            }), {})),
        };
        const updateResult = await db.send(new UpdateItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully updated post.",
            updateResult,
        });
    } catch (error) {
        console.error(error);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to update post.",
            errorMssg: error.message,
            errorStack: error.stack,
        });
    }

    return response;
};


const deleteStore = async(event) => {
    const response = { statusCode: 200 };

    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({ storeId: event.pathParameters.storeId }),
        };
        const deleteResult = await db.send(new DeleteItemCommand(params));

        response.body = JSON.stringify({
            message: "Successfully deleted post",
            deleteResult,
        });

    } catch (e) {
        console.error(e);
        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to delete post.",
            errorMsg: e.message,
            errorStack : e.stack,
        })
    }

    return response;
}


const getAllStores = async() => {
    const response = { statusCode: 200 };
    try {
        const { Items } = await db.send(new ScanCommand({ TableName: process.env.DYNAMODB_TABLE_NAME }));

        response.body = JSON.stringify({
            message: "Successfully retrieved all posts.",
            data: Items.map((item) => unmarshall(item)),
            Items,
        });
    } catch (e) {
        console.error(e);

        response.statusCode = 500;
        response.body = JSON.stringify({
            message: "Failed to retrieve stores.",
            errorMsg: e.message,
            errorStack: e.stack,
        });
    }

    return response;
}


module.exports = {
    getStore,
    createStore,
    updateStore,
    deleteStore,
    getAllStores,
}