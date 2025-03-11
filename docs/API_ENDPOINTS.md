# Banking System API Documentation

## Authentication Endpoints

### Customer Authentication
- [x] `POST /api/v1/customer/signup` - Register new customer
- [x] `POST /api/v1/customer/login` - Login customer
- [x] `POST /api/v1/customer/logout` - Logout customer
- [ ] `POST /api/v1/customer/activate` - Activate customer account
- [ ] `POST /api/v1/customer/reset-password` - Reset customer password
- [ ] `GET /api/v1/customer/profile` - Get customer profile
- [ ] `PUT /api/v1/customer/profile` - Update customer profile

## Account Management

### Account Operations
- [ ] `POST /api/v1/accounts` - Create new account
- [ ] `GET /api/v1/accounts` - List all accounts of customer
- [ ] `GET /api/v1/accounts/{accountNo}` - Get account details
- [ ] `PUT /api/v1/accounts/{accountNo}` - Update account (e.g., activate/deactivate)
- [ ] `GET /api/v1/accounts/{accountNo}/balance` - Get account balance

## Transaction Management

### Transaction Operations
- [x] `POST /api/v1/transactions/deposit` - Deposit money
  - **Description**: Deposit money into a customer's account
  - **Authentication**: Required (Bearer Token)
  - **Request Body**:
    ```json
    {
      "accountNo": "string",
      "amount": "decimal",
      "description": "string (optional)"
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "message": "Deposit successful",
      "transaction": {
        "transactionId": "string",
        "type": "DEPOSIT",
        "amount": "decimal",
        "description": "string",
        "status": "COMPLETED",
        "accountId": "number",
        "createdAt": "datetime"
      },
      "account": {
        "accountNo": "string",
        "balance": "decimal",
        "currency": "string"
      }
    }
    ```
  - **Error Responses**:
    - `400 Bad Request`: Invalid amount or account number
    - `401 Unauthorized`: Invalid or missing authentication token
    - `404 Not Found`: Account not found
    - `500 Internal Server Error`: Server error during transaction processing
- [ ] `POST /api/v1/transactions/withdraw` - Withdraw money
- [ ] `POST /api/v1/transactions/transfer` - Transfer money between accounts
- [ ] `GET /api/v1/transactions` - List transactions (with filters)
- [ ] `GET /api/v1/transactions/{transactionId}` - Get transaction details

## Request/Response Formats

### Account Creation
```typescript
POST /api/v1/accounts
Request:
{
    "currency": "USD",  // Default: USD
}
Response:
{
    "accountNo": string,
    "balance": number,
    "currency": string,
    "isActive": boolean,
    "createdAt": string
}
```

### Transaction - Deposit
```typescript
POST /api/v1/transactions/deposit
Request:
{
    "accountNo": string,
    "amount": number,
    "description": string
}
Response:
{
    "transactionId": string,
    "type": "DEPOSIT",
    "amount": number,
    "status": "COMPLETED",
    "accountNo": string,
    "createdAt": string
}
```

### Transaction - Withdrawal
```typescript
POST /api/v1/transactions/withdraw
Request:
{
    "accountNo": string,
    "amount": number,
    "description": string
}
Response:
{
    "transactionId": string,
    "type": "WITHDRAWAL",
    "amount": number,
    "status": "COMPLETED",
    "accountNo": string,
    "createdAt": string
}
```

### Transaction - Transfer
```typescript
POST /api/v1/transactions/transfer
Request:
{
    "fromAccountNo": string,
    "toAccountNo": string,
    "amount": number,
    "description": string
}
Response:
{
    "transactionId": string,
    "type": "TRANSFER",
    "amount": number,
    "status": "COMPLETED",
    "fromAccountNo": string,
    "toAccountNo": string,
    "createdAt": string
}
```

## Important Implementation Notes

### Security Considerations
1. All endpoints except login/signup must require authentication
2. Implement rate limiting for sensitive operations
3. Validate all input data
4. Log all financial transactions
5. Implement 2FA for high-value transactions

### Transaction Rules
1. Cannot withdraw more than available balance
2. Minimum balance requirements (if any)
3. Daily transaction limits
4. Transaction amount precision (2 decimal places)

### Account Rules
1. One customer can have multiple accounts
2. Account numbers must be unique
3. Accounts can be deactivated but not deleted
4. Default currency is USD

### Error Handling
- Implement proper error responses for:
  - Insufficient funds
  - Invalid account numbers
  - Account not active
  - Transaction limits exceeded
  - Invalid transaction amounts
  - Authentication failures

### Monitoring
- Implement logging for:
  - All financial transactions
  - Login attempts
  - Account creation/modification
  - Error scenarios
