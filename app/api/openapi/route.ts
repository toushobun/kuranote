export async function GET() {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "UchiLog API",
      version: "1.0.0",
      description: "UchiLog 家庭记账应用 REST API",
    },
    servers: [
      {
        url: "/api",
        description: "当前服务器",
      },
    ],
    tags: [
      { name: "Accounts", description: "账户管理" },
      { name: "Merchants", description: "商家管理" },
      { name: "Transactions", description: "交易记录" },
    ],
    paths: {
      "/accounts": {
        get: {
          summary: "获取账户列表",
          tags: ["Accounts"],
          responses: {
            "200": { description: "成功，返回账户列表" },
            "401": { description: "未登录" },
          },
        },
        post: {
          summary: "创建账户",
          tags: ["Accounts"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateAccountBody" },
              },
            },
          },
          responses: {
            "201": { description: "创建成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
      "/accounts/{id}": {
        patch: {
          summary: "更新账户",
          tags: ["Accounts"],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateAccountBody" },
              },
            },
          },
          responses: {
            "200": { description: "成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
        delete: {
          summary: "归档账户",
          tags: ["Accounts"],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            "200": { description: "成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
      "/merchants": {
        get: {
          summary: "获取商家列表",
          tags: ["Merchants"],
          parameters: [
            {
              in: "query",
              name: "keyword",
              schema: { type: "string" },
              description: "搜索关键词",
            },
          ],
          responses: {
            "200": { description: "成功，返回商家列表" },
            "401": { description: "未登录" },
          },
        },
        post: {
          summary: "创建商家",
          tags: ["Merchants"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateMerchantBody" },
              },
            },
          },
          responses: {
            "201": { description: "创建成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
      "/merchants/{id}": {
        patch: {
          summary: "更新商家",
          tags: ["Merchants"],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateMerchantBody" },
              },
            },
          },
          responses: {
            "200": { description: "成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
        delete: {
          summary: "归档商家",
          tags: ["Merchants"],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            "200": { description: "成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
      "/merchants/{id}/aliases": {
        post: {
          summary: "添加商家别名",
          tags: ["Merchants"],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["alias"],
                  properties: {
                    alias: { type: "string", maxLength: 100 },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "创建成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
      "/merchants/{id}/aliases/{aliasId}": {
        delete: {
          summary: "归档商家别名",
          tags: ["Merchants"],
          parameters: [
            { $ref: "#/components/parameters/IdParam" },
            {
              in: "path",
              name: "aliasId",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
      "/transactions": {
        get: {
          summary: "获取交易记录列表",
          tags: ["Transactions"],
          parameters: [
            {
              in: "query",
              name: "offset",
              schema: { type: "integer", default: 0 },
            },
          ],
          responses: {
            "200": { description: "成功，返回分页列表" },
            "401": { description: "未登录" },
          },
        },
        post: {
          summary: "创建交易记录",
          tags: ["Transactions"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateTransactionBody",
                },
              },
            },
          },
          responses: {
            "201": { description: "创建成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
      "/transactions/{id}": {
        delete: {
          summary: "作废交易记录",
          tags: ["Transactions"],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            "200": { description: "成功" },
            "400": { description: "参数错误" },
            "401": { description: "未登录" },
          },
        },
      },
    },
    components: {
      parameters: {
        IdParam: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      },
      schemas: {
        CreateAccountBody: {
          type: "object",
          required: ["name", "type", "currency", "holderUserIds"],
          properties: {
            name: { type: "string" },
            type: {
              type: "string",
              enum: [
                "checking",
                "savings",
                "credit",
                "investment",
                "cash",
                "other",
              ],
            },
            currency: {
              type: "string",
              example: "CNY",
              pattern: "^[A-Z]{3}$",
            },
            initialBalance: { type: "number", default: 0 },
            holderUserIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
          },
        },
        UpdateAccountBody: {
          type: "object",
          required: ["name", "type", "currency", "holderUserIds"],
          properties: {
            name: { type: "string" },
            type: {
              type: "string",
              enum: [
                "checking",
                "savings",
                "credit",
                "investment",
                "cash",
                "other",
              ],
            },
            currency: {
              type: "string",
              example: "CNY",
              pattern: "^[A-Z]{3}$",
            },
            holderUserIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
          },
        },
        CreateMerchantBody: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", maxLength: 100 },
            websiteUrl: { type: "string", format: "uri" },
            note: { type: "string", maxLength: 1000 },
          },
        },
        CreateTransactionBody: {
          type: "object",
          required: [
            "accountId",
            "amount",
            "type",
            "transactionAt",
            "categoryId",
          ],
          properties: {
            accountId: { type: "string", format: "uuid" },
            amount: { type: "number", exclusiveMinimum: 0 },
            type: { type: "string", enum: ["expense", "income"] },
            transactionAt: { type: "string", format: "date-time" },
            categoryId: { type: "string", format: "uuid" },
            merchantId: { type: "string", format: "uuid" },
            note: { type: "string" },
          },
        },
      },
    },
  };

  return Response.json(spec);
}
