# CluttrServer API Documentation

**Version:** 1.0.0

Home Inventory Sync Server API

**Generated:** 2026-02-24T23:13:06.486Z

## Table of Contents

- [Todo Items](#todo-items)
  - [GET List all todo items for a home](#todo-items-list)
  - [POST Create a new todo item](#todo-items-create)
  - [PATCH Update a todo item](#todo-items-update)
  - [GET Get details of a specific todo item](#todo-items-get)
  - [DELETE Delete a todo item](#todo-items-delete)
- [Todo Categories](#todo-categories)
  - [DELETE Delete a todo category](#todo-categories-delete)
  - [PATCH Update a todo category](#todo-categories-update)
  - [GET List all todo categories for a home](#todo-categories-list)
  - [POST Create a new todo category](#todo-categories-create)
  - [GET Get details of a specific todo category](#todo-categories-get)
- [Auth](#auth)
  - [POST Authenticate with Google OAuth](#auth-google-login)
  - [POST Authenticate with email and password](#auth-login)
  - [PATCH Update current user profile](#auth-update-user)
  - [POST Request password reset code](#auth-password-reset-request)
  - [GET Get current authenticated user](#auth-get-current-user)
  - [POST Resend email verification code](#auth-resend-verification)
  - [POST Verify password reset code and reset password](#auth-password-reset-verify)
  - [POST Request email verification code](#auth-request-verification)
  - [GET Get email verification status](#auth-verification-status)
  - [POST Verify email with code](#auth-verify-email)
  - [POST Create a new user account](#auth-signup)
- [Images](#images)
  - [POST Upload an image to B2 storage](#images-upload-image)
- [Homes](#homes)
  - [GET List all homes for the authenticated user](#homes-list)
  - [PATCH Update home details](#homes-update)
  - [DELETE Remove a member from a home](#homes-remove-member)
  - [GET Get home invitation details](#homes-get-invitation)
  - [DELETE Delete a home](#homes-delete)
  - [GET Get details of a specific home](#homes-get)
  - [PATCH Update home sharing settings](#homes-update-settings)
  - [POST Regenerate home invitation code](#homes-regenerate-invitation)
  - [POST Create a new home](#homes-create)
  - [GET List all members of a home](#homes-list-members)
- [Inventory Items](#inventory-items)
  - [GET Get details of a specific inventory item](#inventory-items-get)
  - [PATCH Update an inventory item](#inventory-items-update)
  - [DELETE Delete an inventory item](#inventory-items-delete)
  - [GET List all inventory items for a home](#inventory-items-list)
  - [POST Create a new inventory item](#inventory-items-create)
- [Ai](#ai)
  - [POST Recognize inventory item from image](#ai-recognize-item)
- [Locations](#locations)
  - [POST Create a new location](#locations-create)
  - [GET List all locations for a home](#locations-list)
  - [DELETE Delete a location](#locations-delete)
  - [PATCH Update a location](#locations-update)
  - [GET Get details of a specific location](#locations-get)
- [Inventory Categories](#inventory-categories)
  - [DELETE Delete an inventory category](#inventory-categories-delete)
  - [GET Get a specific inventory category](#inventory-categories-get)
  - [PATCH Update an inventory category](#inventory-categories-update)
  - [POST Create a new inventory category](#inventory-categories-create)
  - [GET List all inventory categories for a home](#inventory-categories-list)
- [Debug](#debug)
  - [GET Interactive API Debug Dashboard](#debug-get-debugz)
  - [POST Proxy requests to API endpoints](#debug-proxy-debugz-request)
  - [GET Get handler metadata for debug UI](#debug-get-debugz-api)
- [Invitations](#invitations)


---

## Todo Items

### GET /homes/:homeId/todos

<a id="todo-items-list"></a>

**ID:** `todo_items.list`

**List all todo items for a home**

Retrieves a list of all todo items for a home. User must be a member of home. Optionally filter by completion status.

**Authentication:** Required (jwt)

**Tags:** `Todo Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to get todo items from |

#### Response (200)

List of todo items retrieved successfully

**Example:**

```json
{
  "todoItems": [
    {
      "todoId": "buy-groceries",
      "homeId": "my-home",
      "text": "Buy groceries from the store",
      "completed": false,
      "completedAt": null,
      "position": 0,
      "categoryId": "shopping",
      "createdBy": "507f1f77bcf86cd799439011",
      "updatedBy": "507f1f77bcf86cd799439011",
      "createdByDeviceId": null,
      "updatedByDeviceId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_items.create`](#todo-items-create)
- [`todo_items.get`](#todo-items-get)
- [`todo_items.update`](#todo-items-update)
- [`todo_items.delete`](#todo-items-delete)

### POST /homes/:homeId/todos

<a id="todo-items-create"></a>

**ID:** `todo_items.create`

**Create a new todo item**

Creates a new todo item in a home. The user must be a member of home. Each todo item has a unique todoId within the home, text content, completion status, and position.

**Authentication:** Required (jwt)

**Tags:** `Todo Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to create the todo item in |

#### Request Body

**Content-Type:** `application/json`

Todo item creation details

**Required:** Yes

**Example:**

```json
{
  "todoId": "buy-groceries",
  "text": "Buy groceries from the store",
  "completed": false,
  "position": 0
}
```

#### Response (201)

Todo item created successfully

**Example:**

```json
{
  "todoItem": {
    "todoId": "buy-groceries",
    "homeId": "my-home",
    "text": "Buy groceries from the store",
    "completed": false,
    "completedAt": null,
    "position": 0,
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Validation error

Invalid request parameters

**Example:**

```json
{
  "error": "todoId_required",
  "message": "todoId is required"
}
```

##### 400 - `INVALID_TODO_ID`

Invalid todoId format

todoId must be 4\-50 characters, alphanumeric with hyphens or underscores

**Example:**

```json
{
  "error": "invalid_todo_id",
  "message": "todoId must be 4-50 characters, alphanumeric with hyphens or underscores"
}
```

##### 400 - `TEXT_REQUIRED`

Text is required

Text cannot be empty

**Example:**

```json
{
  "error": "text_required",
  "message": "text is required"
}
```

##### 400 - `TEXT_TOO_LONG`

Text too long

Text must be 1000 characters or less

**Example:**

```json
{
  "error": "text_too_long",
  "message": "text must be 1000 characters or less"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 409 - `TODO_ID_EXISTS`

Todo ID already exists

A todo with this ID already exists in this home

**Example:**

```json
{
  "error": "todo_id_exists",
  "message": "A todo with this ID already exists in this home",
  "suggestedTodoId": "buy-groceries-2"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_items.list`](#todo-items-list)
- [`todo_items.get`](#todo-items-get)
- [`todo_items.update`](#todo-items-update)
- [`todo_items.delete`](#todo-items-delete)

### PATCH /homes/:homeId/todos/:todoId

<a id="todo-items-update"></a>

**ID:** `todo_items.update`

**Update a todo item**

Updates specific fields of an existing todo item. User must be a member of the home that contains the todo item. Only fields provided in request body will be updated. When completed status changes to true, completedAt is set. When completed changes to false, completedAt is cleared.

**Authentication:** Required (jwt)

**Tags:** `Todo Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the todo item |
| `todoId` | string | Yes | The unique identifier of the todo item |

#### Request Body

**Content-Type:** `application/json`

Todo item fields to update

**Required:** Yes

**Example:**

```json
{
  "text": "Buy groceries from the store - updated",
  "completed": true
}
```

#### Response (200)

Todo item updated successfully

**Example:**

```json
{
  "todoItem": {
    "todoId": "buy-groceries",
    "homeId": "my-home",
    "text": "Buy groceries from the store - updated",
    "completed": true,
    "completedAt": "2024-01-15T11:00:00.000Z",
    "position": 0,
    "categoryId": "shopping",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `TODO_ID_REQUIRED`

todoId is required

The todoId path parameter must be provided

**Example:**

```json
{
  "error": "todoId_required",
  "message": "todoId is required"
}
```

##### 400 - `INVALID_TEXT`

Invalid text

Text cannot be empty

**Example:**

```json
{
  "error": "invalid_text",
  "message": "text cannot be empty"
}
```

##### 400 - `TEXT_TOO_LONG`

Text too long

Text must be 1000 characters or less

**Example:**

```json
{
  "error": "text_too_long",
  "message": "text must be 1000 characters or less"
}
```

##### 400 - `INVALID_POSITION`

Invalid position

Position must be a non\-negative number

**Example:**

```json
{
  "error": "invalid_position",
  "message": "position must be a non-negative number"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `TODO_NOT_FOUND`

Todo item not found

No todo item exists with the provided todoId

**Example:**

```json
{
  "error": "todo_not_found",
  "message": "Todo item not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_items.create`](#todo-items-create)
- [`todo_items.list`](#todo-items-list)
- [`todo_items.get`](#todo-items-get)
- [`todo_items.delete`](#todo-items-delete)

### GET /homes/:homeId/todos/:todoId

<a id="todo-items-get"></a>

**ID:** `todo_items.get`

**Get details of a specific todo item**

Retrieves detailed information about a specific todo item. User must be a member of the home that contains the todo item.

**Authentication:** Required (jwt)

**Tags:** `Todo Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the todo item |
| `todoId` | string | Yes | The unique identifier of the todo item |

#### Response (200)

Todo item details retrieved successfully

**Example:**

```json
{
  "todoItem": {
    "todoId": "buy-groceries",
    "homeId": "my-home",
    "text": "Buy groceries from the store",
    "completed": false,
    "completedAt": null,
    "position": 0,
    "categoryId": "shopping",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `TODO_ID_REQUIRED`

todoId is required

The todoId path parameter must be provided

**Example:**

```json
{
  "error": "todoId_required",
  "message": "todoId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `TODO_NOT_FOUND`

Todo item not found

No todo item exists with the provided todoId

**Example:**

```json
{
  "error": "todo_not_found",
  "message": "Todo item not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_items.create`](#todo-items-create)
- [`todo_items.list`](#todo-items-list)
- [`todo_items.update`](#todo-items-update)
- [`todo_items.delete`](#todo-items-delete)

### DELETE /homes/:homeId/todos/:todoId

<a id="todo-items-delete"></a>

**ID:** `todo_items.delete`

**Delete a todo item**

Soft deletes a todo item by setting deletedAt and deletedBy fields. User must be a member of the home that contains the todo item. The todo item remains in the database but is excluded from queries.

**Authentication:** Required (jwt)

**Tags:** `Todo Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the todo item |
| `todoId` | string | Yes | The unique identifier of the todo item |

#### Response (200)

Todo item deleted successfully

**Example:**

```json
{
  "success": true,
  "message": "Todo item deleted successfully",
  "deletedAt": "2024-01-15T11:00:00.000Z"
}
```

#### Error Responses

##### 400 - `TODO_ID_REQUIRED`

todoId is required

The todoId path parameter must be provided

**Example:**

```json
{
  "error": "todoId_required",
  "message": "todoId is required"
}
```

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `TODO_NOT_FOUND`

Todo item not found

No todo item exists with the provided todoId

**Example:**

```json
{
  "error": "todo_not_found",
  "message": "Todo item not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_items.create`](#todo-items-create)
- [`todo_items.list`](#todo-items-list)
- [`todo_items.get`](#todo-items-get)
- [`todo_items.update`](#todo-items-update)


---

## Todo Categories

### DELETE /homes/:homeId/todo-categories/:categoryId

<a id="todo-categories-delete"></a>

**ID:** `todo_categories.delete`

**Delete a todo category**

Soft deletes a todo category by setting deletedAt and deletedBy fields. User must be a member of the home that contains the category. The category remains in the database but is excluded from queries.

**Authentication:** Required (jwt)

**Tags:** `Todo Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the category |
| `categoryId` | string | Yes | The unique identifier of the todo category |

#### Response (200)

Todo category deleted successfully

**Example:**

```json
{
  "message": "Todo category deleted successfully",
  "categoryId": "shopping"
}
```

#### Error Responses

##### 400 - `CATEGORY_ID_REQUIRED`

categoryId is required

The categoryId path parameter must be provided

**Example:**

```json
{
  "error": "categoryId_required",
  "message": "categoryId is required"
}
```

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `CATEGORY_NOT_FOUND`

Todo category not found

No todo category exists with the provided categoryId

**Example:**

```json
{
  "error": "category_not_found",
  "message": "Todo category not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_categories.create`](#todo-categories-create)
- [`todo_categories.list`](#todo-categories-list)
- [`todo_categories.get`](#todo-categories-get)
- [`todo_categories.update`](#todo-categories-update)

### PATCH /homes/:homeId/todo-categories/:categoryId

<a id="todo-categories-update"></a>

**ID:** `todo_categories.update`

**Update a todo category**

Updates specific fields of an existing todo category. User must be a member of the home that contains the category. Only fields provided in request body will be updated.

**Authentication:** Required (jwt)

**Tags:** `Todo Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the category |
| `categoryId` | string | Yes | The unique identifier of the todo category |

#### Request Body

**Content-Type:** `application/json`

Todo category fields to update

**Required:** Yes

**Example:**

```json
{
  "name": "Shopping List",
  "color": "#3498db"
}
```

#### Response (200)

Todo category updated successfully

**Example:**

```json
{
  "todoCategory": {
    "categoryId": "shopping",
    "homeId": "my-home",
    "name": "Shopping List",
    "description": "Groceries and household items",
    "color": "#3498db",
    "icon": "cart",
    "position": 0,
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `CATEGORY_ID_REQUIRED`

categoryId is required

The categoryId path parameter must be provided

**Example:**

```json
{
  "error": "categoryId_required",
  "message": "categoryId is required"
}
```

##### 400 - `NAME_REQUIRED`

Name is required

Name cannot be empty

**Example:**

```json
{
  "error": "name_required",
  "message": "name cannot be empty"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 100 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 100 characters or less"
}
```

##### 400 - `DESCRIPTION_TOO_LONG`

Description too long

Description must be 500 characters or less

**Example:**

```json
{
  "error": "description_too_long",
  "message": "description must be 500 characters or less"
}
```

##### 400 - `INVALID_COLOR`

Invalid color format

Color must be a valid hex color code

**Example:**

```json
{
  "error": "invalid_color",
  "message": "color must be a valid hex color code (e.g., #FF5733)"
}
```

##### 400 - `ICON_TOO_LONG`

Icon too long

Icon must be 50 characters or less

**Example:**

```json
{
  "error": "icon_too_long",
  "message": "icon must be 50 characters or less"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `CATEGORY_NOT_FOUND`

Todo category not found

No todo category exists with the provided categoryId

**Example:**

```json
{
  "error": "category_not_found",
  "message": "Todo category not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_categories.create`](#todo-categories-create)
- [`todo_categories.list`](#todo-categories-list)
- [`todo_categories.get`](#todo-categories-get)
- [`todo_categories.delete`](#todo-categories-delete)

### GET /homes/:homeId/todo-categories

<a id="todo-categories-list"></a>

**ID:** `todo_categories.list`

**List all todo categories for a home**

Retrieves a list of all todo categories for a home. User must be a member of the home. Categories are ordered by position.

**Authentication:** Required (jwt)

**Tags:** `Todo Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to get todo categories from |

#### Response (200)

List of todo categories retrieved successfully

**Example:**

```json
{
  "todoCategories": [
    {
      "categoryId": "shopping",
      "homeId": "my-home",
      "name": "Shopping",
      "description": "Groceries and household items",
      "color": "#FF5733",
      "icon": "cart",
      "position": 0,
      "createdBy": "507f1f77bcf86cd799439011",
      "updatedBy": "507f1f77bcf86cd799439011",
      "createdByDeviceId": null,
      "updatedByDeviceId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_categories.create`](#todo-categories-create)
- [`todo_categories.get`](#todo-categories-get)
- [`todo_categories.update`](#todo-categories-update)
- [`todo_categories.delete`](#todo-categories-delete)

### POST /homes/:homeId/todo-categories

<a id="todo-categories-create"></a>

**ID:** `todo_categories.create`

**Create a new todo category**

Creates a new todo category in a home. The user must be a member of the home. Each todo category has a unique categoryId within the home, a name, optional description, color, and icon.

**Authentication:** Required (jwt)

**Tags:** `Todo Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to create the todo category in |

#### Request Body

**Content-Type:** `application/json`

Todo category creation details

**Required:** Yes

**Example:**

```json
{
  "categoryId": "shopping",
  "name": "Shopping",
  "description": "Groceries and household items",
  "color": "#FF5733",
  "icon": "cart",
  "position": 0
}
```

#### Response (201)

Todo category created successfully

**Example:**

```json
{
  "todoCategory": {
    "categoryId": "shopping",
    "homeId": "my-home",
    "name": "Shopping",
    "description": "Groceries and household items",
    "color": "#FF5733",
    "icon": "cart",
    "position": 0,
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Validation error

Invalid request parameters

**Example:**

```json
{
  "error": "categoryId_required",
  "message": "categoryId is required"
}
```

##### 400 - `INVALID_CATEGORY_ID`

Invalid categoryId format

categoryId must be 4\-50 characters, alphanumeric with hyphens or underscores

**Example:**

```json
{
  "error": "invalid_category_id",
  "message": "categoryId must be 4-50 characters, alphanumeric with hyphens or underscores"
}
```

##### 400 - `NAME_REQUIRED`

Name is required

Name cannot be empty

**Example:**

```json
{
  "error": "name_required",
  "message": "name is required"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 100 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 100 characters or less"
}
```

##### 400 - `INVALID_COLOR`

Invalid color format

Color must be a valid hex color code

**Example:**

```json
{
  "error": "invalid_color",
  "message": "color must be a valid hex color code (e.g., #FF5733)"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 409 - `CATEGORY_ID_EXISTS`

Category ID already exists

A todo category with this ID already exists in this home

**Example:**

```json
{
  "error": "category_id_exists",
  "message": "A todo category with this ID already exists in this home",
  "suggestedCategoryId": "shopping-2"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_categories.list`](#todo-categories-list)
- [`todo_categories.get`](#todo-categories-get)
- [`todo_categories.update`](#todo-categories-update)
- [`todo_categories.delete`](#todo-categories-delete)

### GET /homes/:homeId/todo-categories/:categoryId

<a id="todo-categories-get"></a>

**ID:** `todo_categories.get`

**Get details of a specific todo category**

Retrieves detailed information about a specific todo category. User must be a member of the home that contains the category.

**Authentication:** Required (jwt)

**Tags:** `Todo Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the category |
| `categoryId` | string | Yes | The unique identifier of the todo category |

#### Response (200)

Todo category details retrieved successfully

**Example:**

```json
{
  "todoCategory": {
    "categoryId": "shopping",
    "homeId": "my-home",
    "name": "Shopping",
    "description": "Groceries and household items",
    "color": "#FF5733",
    "icon": "cart",
    "position": 0,
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `CATEGORY_ID_REQUIRED`

categoryId is required

The categoryId path parameter must be provided

**Example:**

```json
{
  "error": "categoryId_required",
  "message": "categoryId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `CATEGORY_NOT_FOUND`

Todo category not found

No todo category exists with the provided categoryId

**Example:**

```json
{
  "error": "category_not_found",
  "message": "Todo category not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`todo_categories.create`](#todo-categories-create)
- [`todo_categories.list`](#todo-categories-list)
- [`todo_categories.update`](#todo-categories-update)
- [`todo_categories.delete`](#todo-categories-delete)


---

## Auth

### POST /auth/google

<a id="auth-google-login"></a>

**ID:** `auth.google_login`

**Authenticate with Google OAuth**

Authenticates a user using their Google account via ID Token verification. The mobile app handles the Google Sign-In flow and sends the ID token to the server.

**Platform-specific client IDs are required** and must match the platform sending the request.

If the Google account is not linked to an existing user, a new account will be created automatically.

**Authentication:** Not required

**Tags:** `Authentication`

#### Request Body

**Content-Type:** `application/json`

Google ID Token and platform information

**Required:** Yes

**Example:**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...token from Google",
  "platform": "ios"
}
```

#### Response (200)

Authentication successful

**Example:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@gmail.com",
    "nickname": "John Doe",
    "avatarUrl": "https://lh3.googleusercontent.com/..."
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

ID token and platform are required

Both idToken and platform must be provided in the request body

**Example:**

```json
{
  "message": "ID token and platform are required"
}
```

##### 401 - `INVALID_TOKEN`

Invalid Google ID token

The provided ID token is invalid or expired

**Example:**

```json
{
  "message": "Invalid Google ID token"
}
```

##### 401 - `WRONG_PLATFORM`

Token issued for wrong platform

The ID token was issued for a different platform than specified

**Example:**

```json
{
  "message": "Token issued for wrong platform"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`auth.signup`](#auth-signup)
- [`auth.login`](#auth-login)
- [`auth.get_current_user`](#auth-get-current-user)

### POST /auth/login

<a id="auth-login"></a>

**ID:** `auth.login`

**Authenticate with email and password**

Authenticates a user using their email and password. Returns a JWT access token that can be used for authenticated requests.

**Authentication:** Not required

**Tags:** `Authentication`

#### Request Body

**Content-Type:** `application/json`

User login credentials

**Required:** Yes

**Example:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response (200)

Authentication successful

**Example:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "nickname": "User",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Email and password are required

Both email and password must be provided

**Example:**

```json
{
  "message": "Email and password are required"
}
```

##### 401 - `INVALID_CREDENTIALS`

Invalid email or password

The provided credentials are incorrect

**Example:**

```json
{
  "message": "Invalid email or password"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`auth.signup`](#auth-signup)
- [`auth.google_login`](#auth-google-login)
- [`auth.get_current_user`](#auth-get-current-user)

### PATCH /auth/me

<a id="auth-update-user"></a>

**ID:** `auth.update_user`

**Update current user profile**

Updates the authenticated user profile. Supports updating nickname, avatar URL, and password. To change the password, the current password must be provided.

**Authentication:** Required (jwt) - Requires valid JWT token from login/signup/google_login

**Tags:** `Authentication`

#### Headers

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `Authorization` | string | Yes | JWT bearer token \(format: Bearer <token>\) |

#### Request Body

**Content-Type:** `application/json`

User profile updates (all fields optional)

**Required:** No

**Example:**

```json
{
  "nickname": "John Doe",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

#### Response (200)

User profile updated successfully

**Example:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "nickname": "John Doe",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "accountSettings": {
    "canShareInventory": true,
    "canShareTodos": true
  }
}
```

#### Error Responses

##### 400 - `INVALID_PASSWORD`

New password must be at least 6 characters

The new password does not meet the minimum length requirement

**Example:**

```json
{
  "message": "New password must be at least 6 characters"
}
```

##### 401 - `WRONG_PASSWORD`

Current password is incorrect

The provided current password does not match the stored password

**Example:**

```json
{
  "message": "Current password is incorrect"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized \- invalid or expired token

The JWT token is missing, invalid, or has expired

**Example:**

```json
{
  "message": "Unauthorized - invalid or expired token"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`auth.get_current_user`](#auth-get-current-user)
- [`auth.login`](#auth-login)

### POST /auth/password-reset/request

<a id="auth-password-reset-request"></a>

**ID:** `auth.password_reset_request`

**Request password reset code**

Sends a 6-digit password reset code to the specified email address. The code expires after 5 minutes. This endpoint does not require authentication. All users can request a password reset, including OAuth users who may want to set a password for email/password login.

**Rate Limits:**
- Maximum 3 requests per hour per email address

**Security Note:** This endpoint returns the same response regardless of whether the email exists in the system, preventing email enumeration attacks.

**Authentication:** Not required

**Tags:** `Authentication`, `Password Reset`

#### Request Body

**Content-Type:** `application/json`

Email address to send password reset code

**Required:** Yes

**Example:**

```json
{
  "email": "user@example.com"
}
```

#### Response (202)

Password reset code sent successfully \(or email not found\)

**Example:**

```json
{
  "message": "If an account exists with this email, a password reset code has been sent",
  "expiresIn": 300
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Invalid email format

The provided email address is not valid

**Example:**

```json
{
  "message": "Invalid email format"
}
```

##### 429 - `RATE_LIMIT_EXCEEDED`

Too many requests

Too many password reset requests\. Please try again later \(max 3 per hour\)

**Example:**

```json
{
  "message": "Too many password reset requests. Please try again later."
}
```

##### 500 - `SERVER_ERROR`

Failed to send password reset email

An error occurred while sending the email

**Example:**

```json
{
  "message": "Failed to send password reset email"
}
```

**Related Endpoints:**

- [`auth.password_reset_verify`](#auth-password-reset-verify)
- [`auth.signup`](#auth-signup)
- [`auth.login`](#auth-login)

### GET /auth/me

<a id="auth-get-current-user"></a>

**ID:** `auth.get_current_user`

**Get current authenticated user**

Retrieves information about the currently authenticated user. The user is identified via the JWT token in the Authorization header.

**Authentication:** Required (jwt) - Requires valid JWT token from login/signup/google_login

**Tags:** `Authentication`

#### Headers

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `Authorization` | string | Yes | JWT bearer token \(format: Bearer <token>\) |

#### Response (200)

User information retrieved successfully

**Example:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "nickname": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "invitationCode": "AB12CD34EF56GH78",
  "accountSettings": {
    "canShareInventory": true,
    "canShareTodos": true
  },
  "memberships": [
    {
      "accountId": "507f1f77bcf86cd799439012",
      "joinedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 401 - `UNAUTHORIZED`

Unauthorized \- invalid or expired token

The JWT token is missing, invalid, or has expired

**Example:**

```json
{
  "message": "Unauthorized - invalid or expired token"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`auth.update_user`](#auth-update-user)
- [`auth.login`](#auth-login)
- [`auth.signup`](#auth-signup)

### POST /auth/verification/resend

<a id="auth-resend-verification"></a>

**ID:** `auth.resend_verification`

**Resend email verification code**

Resends a verification code to the user's email. Can be used with authentication (uses the authenticated user's email) or without authentication (requires email in request body).

**Rate Limits:**
- Maximum 3 requests per hour per email address

**Note:** This endpoint returns the same response regardless of whether the email exists in the system, preventing email enumeration attacks.

**Authentication:** Not required

**Tags:** `Authentication`, `Email Verification`

#### Request Body

**Content-Type:** `application/json`

Email address (optional if authenticated)

**Required:** No

**Example:**

```json
{
  "email": "user@example.com"
}
```

#### Response (202)

Verification code resent successfully

**Example:**

```json
{
  "message": "Verification code sent to your email",
  "expiresIn": 900
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Invalid email format

The provided email address is not valid

**Example:**

```json
{
  "message": "Invalid email format"
}
```

##### 400 - `ALREADY_VERIFIED`

Email already verified

The email is already verified

**Example:**

```json
{
  "message": "Email is already verified"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

Invalid or missing authentication when using authenticated mode

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 404 - `USER_NOT_FOUND`

User not found

No user found with this email \(when authenticated\)

**Example:**

```json
{
  "message": "User not found"
}
```

##### 429 - `RATE_LIMIT_EXCEEDED`

Too many requests

Too many verification requests\. Please try again later \(max 3 per hour\)

**Example:**

```json
{
  "message": "Too many verification requests. Please try again later."
}
```

##### 500 - `SERVER_ERROR`

Failed to send verification email

An error occurred while sending the email

**Example:**

```json
{
  "message": "Failed to send verification email"
}
```

**Related Endpoints:**

- [`auth.request_verification`](#auth-request-verification)
- [`auth.verify_email`](#auth-verify-email)
- [`auth.verification_status`](#auth-verification-status)

### POST /auth/password-reset/verify

<a id="auth-password-reset-verify"></a>

**ID:** `auth.password_reset_verify`

**Verify password reset code and reset password**

Verifies a 6-digit password reset code and updates the user password. The code must have been previously requested via the password reset request endpoint. Codes expire after 5 minutes and have a maximum of 5 verification attempts.

**Rate Limits:**
- Maximum 5 verification attempts per code
- Maximum 5 attempts per 15 minutes per email address

**Password Requirements:**
- Minimum 6 characters

**Security Notes:**
- Uses constant-time comparison to prevent timing attacks
- Code is deleted after successful reset or after max attempts exceeded
- OAuth users (Google/Apple) can also set a password to enable email/password login

**Authentication:** Not required

**Tags:** `Authentication`, `Password Reset`

#### Request Body

**Content-Type:** `application/json`

Password reset verification details

**Required:** Yes

**Example:**

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newSecurePassword123"
}
```

#### Response (200)

Password reset successfully

**Example:**

```json
{
  "message": "Password reset successfully"
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Invalid email format

The provided email address is not valid

**Example:**

```json
{
  "message": "Invalid email format"
}
```

##### 400 - `VALIDATION_ERROR`

Invalid code format

The code must be exactly 6 digits

**Example:**

```json
{
  "message": "Invalid code format"
}
```

##### 400 - `VALIDATION_ERROR`

Password must be at least 6 characters

The new password does not meet minimum length requirements

**Example:**

```json
{
  "message": "Password must be at least 6 characters"
}
```

##### 400 - `INVALID_CODE`

Invalid password reset code

The provided code is incorrect

**Example:**

```json
{
  "message": "Invalid password reset code",
  "remainingAttempts": 4
}
```

##### 400 - `CODE_EXPIRED`

Password reset code has expired

The code has exceeded the 5\-minute expiry time

**Example:**

```json
{
  "message": "Password reset code has expired or is invalid"
}
```

##### 404 - `USER_NOT_FOUND`

User not found

No user exists with the provided email address

**Example:**

```json
{
  "message": "User not found"
}
```

##### 429 - `TOO_MANY_ATTEMPTS`

Too many incorrect attempts

Maximum verification attempts exceeded \(5\)\. Please request a new code\.

**Example:**

```json
{
  "message": "Too many incorrect attempts"
}
```

**Related Endpoints:**

- [`auth.password_reset_request`](#auth-password-reset-request)
- [`auth.login`](#auth-login)
- [`auth.signup`](#auth-signup)

### POST /auth/verification/request

<a id="auth-request-verification"></a>

**ID:** `auth.request_verification`

**Request email verification code**

Sends a 6-digit verification code to the specified email address. The code expires after 15 minutes. This endpoint does not require authentication and can be used before or after account registration.

**Rate Limits:**
- Maximum 3 requests per hour per email address

**Note:** This endpoint returns the same response regardless of whether the email exists in the system, preventing email enumeration attacks.

**Authentication:** Not required

**Tags:** `Authentication`, `Email Verification`

#### Request Body

**Content-Type:** `application/json`

Email address to send verification code

**Required:** Yes

**Example:**

```json
{
  "email": "user@example.com"
}
```

#### Response (202)

Verification code sent successfully

**Example:**

```json
{
  "message": "Verification code sent to your email",
  "expiresIn": 900
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Invalid email format

The provided email address is not valid

**Example:**

```json
{
  "message": "Invalid email format"
}
```

##### 429 - `RATE_LIMIT_EXCEEDED`

Too many requests

Too many verification requests\. Please try again later \(max 3 per hour\)

**Example:**

```json
{
  "message": "Too many verification requests. Please try again later."
}
```

##### 500 - `SERVER_ERROR`

Failed to send verification email

An error occurred while sending the email

**Example:**

```json
{
  "message": "Failed to send verification email"
}
```

**Related Endpoints:**

- [`auth.verify_email`](#auth-verify-email)
- [`auth.resend_verification`](#auth-resend-verification)
- [`auth.verification_status`](#auth-verification-status)

### GET /auth/verification/status

<a id="auth-verification-status"></a>

**ID:** `auth.verification_status`

**Get email verification status**

Returns the email verification status of the authenticated user. This endpoint requires authentication and returns information about whether the user's email has been verified and when.

**Authentication:** Required (jwt)

**Tags:** `Authentication`, `Email Verification`

#### Response (200)

Verification status retrieved successfully

**Example:**

```json
{
  "email": "user@example.com",
  "emailVerified": true,
  "emailVerifiedAt": "2025-02-22T10:15:00.000Z",
  "canRequestNewCode": false
}
```

#### Error Responses

##### 401 - `UNAUTHORIZED`

Unauthorized

Missing or invalid authentication token

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 404 - `USER_NOT_FOUND`

User not found

No user found with the authenticated user ID

**Example:**

```json
{
  "message": "User not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`auth.request_verification`](#auth-request-verification)
- [`auth.verify_email`](#auth-verify-email)
- [`auth.resend_verification`](#auth-resend-verification)

### POST /auth/verification/verify

<a id="auth-verify-email"></a>

**ID:** `auth.verify_email`

**Verify email with code**

Verifies the 6-digit code sent to the user's email and marks the email as verified. Upon successful verification, returns a JWT access token and user data.

**Rate Limits:**
- Maximum 5 verification attempts per code

If the maximum attempts are exceeded, the code is invalidated and a new code must be requested.

**Authentication:** Not required

**Tags:** `Authentication`, `Email Verification`

#### Request Body

**Content-Type:** `application/json`

Email and verification code

**Required:** Yes

**Example:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

#### Response (200)

Email verified successfully

**Example:**

```json
{
  "message": "Email verified successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MGYxZjc3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2MzI1NDIyfQ.signature",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Invalid input

Invalid email or code format

**Example:**

```json
{
  "message": "Invalid code format"
}
```

##### 400 - `CODE_EXPIRED`

Code expired

The verification code has expired

**Example:**

```json
{
  "message": "Verification code has expired"
}
```

##### 400 - `CODE_INVALID`

Invalid verification code

The provided code is incorrect

**Example:**

```json
{
  "message": "Invalid verification code",
  "remainingAttempts": 4
}
```

##### 404 - `USER_NOT_FOUND`

User not found

No user found with this email

**Example:**

```json
{
  "message": "User not found"
}
```

##### 409 - `ALREADY_VERIFIED`

Email already verified

The email is already verified

**Example:**

```json
{
  "message": "Email is already verified"
}
```

##### 429 - `MAX_ATTEMPTS_EXCEEDED`

Too many attempts

Too many incorrect attempts\. Please request a new code \(max 5 per code\)

**Example:**

```json
{
  "message": "Too many incorrect attempts"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`auth.request_verification`](#auth-request-verification)
- [`auth.resend_verification`](#auth-resend-verification)
- [`auth.verification_status`](#auth-verification-status)

### POST /auth/signup

<a id="auth-signup"></a>

**ID:** `auth.signup`

**Create a new user account**

Registers a new user with email and password. The password must be at least 6 characters long. Returns a JWT access token upon successful registration.

**Note:** If you prefer Google authentication, use the `/auth/google` endpoint instead.

**Authentication:** Not required

**Tags:** `Authentication`

#### Request Body

**Content-Type:** `application/json`

User registration details

**Required:** Yes

**Example:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response (201)

User successfully created

**Example:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MGYxZjc3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2MzI1NDIyfQ.signature",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Invalid input

Email and password are required, or password is too short \(minimum 6 characters\)

**Example:**

```json
{
  "message": "Email and password are required"
}
```

##### 409 - `USER_EXISTS`

User already exists

An account with this email address already exists

**Example:**

```json
{
  "message": "User already exists"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`auth.login`](#auth-login)
- [`auth.google_login`](#auth-google-login)


---

## Images

### POST /images/upload

<a id="images-upload-image"></a>

**ID:** `images.upload_image`

**Upload an image to B2 storage**

Uploads an image file to Backblaze B2 cloud storage and returns the public URL. Supported formats: JPEG, PNG, GIF, WebP. Maximum file size: 10MB.

**Authentication:** Required (jwt) - Requires valid JWT token

**Tags:** `Images`

#### File Upload

**Parameter Name:** `image`

Image file to upload

**Max File Size:** 10MB

**Allowed MIME Types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`

#### Response (200)

Image uploaded successfully

**Example:**

```json
{
  "url": "https://f005.backblazeb2.com/file/bucket-name/images/photo-123.jpg"
}
```

#### Error Responses

##### 400 - `NO_FILE_UPLOADED`

No file uploaded

The request did not include a file

**Example:**

```json
{
  "message": "No file uploaded"
}
```

##### 400 - `FILE_TOO_LARGE`

File size exceeds maximum allowed size

The uploaded file is larger than 10MB

**Example:**

```json
{
  "message": "File size exceeds maximum allowed size"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized \- invalid or expired token

**Example:**

```json
{
  "message": "Unauthorized - invalid or expired token"
}
```

##### 500 - `UPLOAD_ERROR`

Failed to upload image

An error occurred while uploading to B2 storage

**Example:**

```json
{
  "message": "Failed to upload image"
}
```


---

## Homes

### GET /homes

<a id="homes-list"></a>

**ID:** `homes.list`

**List all homes for the authenticated user**

Retrieves a list of all homes the authenticated user is a member of, including homes they own and homes they have joined.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Response (200)

List of homes retrieved successfully

**Example:**

```json
{
  "homes": [
    {
      "homeId": "my-home",
      "name": "My Home",
      "address": "123 Main St",
      "invitationCode": "ABCD1234EFGH5678",
      "owner": {
        "userId": "507f1f77bcf86cd799439011",
        "email": "user@example.com",
        "nickname": "User",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "settings": {
        "canShareInventory": true,
        "canShareTodos": true
      },
      "memberCount": 3,
      "isOwner": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.create`](#homes-create)
- [`homes.get`](#homes-get)
- [`homes.update`](#homes-update)
- [`homes.delete`](#homes-delete)

### PATCH /homes/:homeId

<a id="homes-update"></a>

**ID:** `homes.update`

**Update home details**

Updates the name and/or address of a home. Only the home owner can update home details. Fields not included in the request body are not modified.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home |

#### Request Body

**Content-Type:** `application/json`

Home details to update

**Required:** Yes

**Example:**

```json
{
  "name": "Updated Home Name",
  "address": "456 Oak Ave, Newtown, USA"
}
```

#### Response (200)

Home updated successfully

**Example:**

```json
{
  "home": {
    "homeId": "my-home",
    "name": "Updated Home Name",
    "address": "456 Oak Ave, Newtown, USA"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `INVALID_NAME`

Name cannot be empty

The provided name is empty or only whitespace

**Example:**

```json
{
  "error": "invalid_name",
  "message": "name cannot be empty"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 100 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 100 characters or less"
}
```

##### 400 - `ADDRESS_TOO_LONG`

Address too long

Address must be 500 characters or less

**Example:**

```json
{
  "error": "address_too_long",
  "message": "address must be 500 characters or less"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Only the owner can update this home

User is not the owner of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Only the owner can update this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.get`](#homes-get)
- [`homes.create`](#homes-create)
- [`homes.delete`](#homes-delete)

### DELETE /homes/:homeId/members/:userId

<a id="homes-remove-member"></a>

**ID:** `homes.remove_member`

**Remove a member from a home**

Removes a member from a home. The home owner can remove any member except themselves. Regular members can only remove themselves (leave the home). Owners must delete the home instead of removing themselves.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home |
| `userId` | string | Yes | The ID of the user to remove \(or self when leaving\) |

#### Response (200)

Member removed successfully

**Example:**

```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `USER_ID_REQUIRED`

userId is required

The userId parameter must be provided

**Example:**

```json
{
  "error": "userId_required",
  "message": "userId is required"
}
```

##### 400 - `CANNOT_REMOVE_SELF`

Owner cannot leave their own home

Owners cannot remove themselves from their home\. Delete the home instead\.

**Example:**

```json
{
  "error": "cannot_remove_self",
  "message": "Owner cannot leave their own home. Delete the home instead."
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Not a member of this home

User is not a member of the requested home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 403 - `FORBIDDEN_REMOVE_OTHERS`

Only owner can remove other members

Regular members cannot remove other members, only themselves

**Example:**

```json
{
  "error": "forbidden",
  "message": "Only the owner can remove other members"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `MEMBER_NOT_FOUND`

Member not found in this home

The specified userId is not a member of this home

**Example:**

```json
{
  "error": "member_not_found",
  "message": "Member not found in this home"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.list_members`](#homes-list-members)
- [`homes.get`](#homes-get)

### GET /homes/:homeId/invitation

<a id="homes-get-invitation"></a>

**ID:** `homes.get_invitation`

**Get home invitation details**

Retrieves the invitation code, sharing settings, member count, and basic home info. Only the home owner can view invitation details. Use this to share the invitation code with others.

**Authentication:** Required (jwt)

**Tags:** `Homes`, `Invitations`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home |

#### Response (200)

Invitation details retrieved successfully

**Example:**

```json
{
  "invitationCode": "ABCD1234EFGH5678",
  "settings": {
    "canShareInventory": true,
    "canShareTodos": true
  },
  "memberCount": 3,
  "home": {
    "homeId": "my-home",
    "name": "My Home"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Only the owner can view invitation details

User is not the owner of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Only the owner can view invitation details"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.regenerate_invitation`](#homes-regenerate-invitation)
- [`homes.get`](#homes-get)
- [`homes.update_settings`](#homes-update-settings)

### DELETE /homes/:homeId

<a id="homes-delete"></a>

**ID:** `homes.delete`

**Delete a home**

Soft deletes a home. Only the home owner can delete their home. The home is marked as deleted but retained in the database for data recovery purposes.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home to delete |

#### Response (200)

Home deleted successfully

**Example:**

```json
{
  "success": true,
  "message": "Home deleted successfully",
  "deletedAt": "2024-01-20T14:30:00.000Z"
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Only the owner can delete this home

User is not the owner of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Only the owner can delete this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.get`](#homes-get)
- [`homes.update`](#homes-update)
- [`homes.create`](#homes-create)

### GET /homes/:homeId

<a id="homes-get"></a>

**ID:** `homes.get`

**Get details of a specific home**

Retrieves detailed information about a specific home, including owner info, settings, and member count. User must be a member of the home.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home |

#### Response (200)

Home details retrieved successfully

**Example:**

```json
{
  "home": {
    "homeId": "my-home",
    "name": "My Home",
    "address": "123 Main St, Anytown, USA",
    "invitationCode": "ABCD1234EFGH5678",
    "settings": {
      "canShareInventory": true,
      "canShareTodos": true
    },
    "owner": {
      "userId": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "nickname": "User",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "memberCount": 3,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:22:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Not a member of this home

User is not a member of the requested home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.list`](#homes-list)
- [`homes.create`](#homes-create)
- [`homes.update`](#homes-update)
- [`homes.delete`](#homes-delete)

### PATCH /homes/:homeId/settings

<a id="homes-update-settings"></a>

**ID:** `homes.update_settings`

**Update home sharing settings**

Updates the sharing permissions for a home. Controls whether members can share inventory items and/or todo items. Only the home owner can update settings.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home |

#### Request Body

**Content-Type:** `application/json`

Settings to update

**Required:** Yes

**Example:**

```json
{
  "canShareInventory": true,
  "canShareTodos": true
}
```

#### Response (200)

Settings updated successfully

**Example:**

```json
{
  "settings": {
    "canShareInventory": true,
    "canShareTodos": true
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Only the owner can update home settings

User is not the owner of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Only the owner can update home settings"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.get`](#homes-get)
- [`homes.invitation.get`](#homes-invitation-get)
- [`homes.update`](#homes-update)

### POST /homes/:homeId/invitation/regenerate

<a id="homes-regenerate-invitation"></a>

**ID:** `homes.regenerate_invitation`

**Regenerate home invitation code**

Generates a new random 16-character invitation code for the home, invalidating the previous code. Only the home owner can regenerate the invitation code. Use this when you want to revoke existing access or for security reasons.

**Authentication:** Required (jwt)

**Tags:** `Homes`, `Invitations`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home |

#### Response (200)

New invitation code generated successfully

**Example:**

```json
{
  "invitationCode": "XYZW9876ABCD4321"
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Only the owner can regenerate invitation code

User is not the owner of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Only the owner can regenerate invitation code"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.get_invitation`](#homes-get-invitation)
- [`homes.get`](#homes-get)

### POST /homes

<a id="homes-create"></a>

**ID:** `homes.create`

**Create a new home**

Creates a new home with the authenticated user as the owner. Each home has a unique homeId, name, optional address, and auto-generated invitation code for sharing.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Request Body

**Content-Type:** `application/json`

Home creation details

**Required:** Yes

**Example:**

```json
{
  "homeId": "my-home",
  "name": "My Home",
  "address": "123 Main St, Anytown, USA"
}
```

#### Response (201)

Home created successfully

**Example:**

```json
{
  "home": {
    "homeId": "my-home",
    "name": "My Home",
    "address": "123 Main St, Anytown, USA",
    "invitationCode": "ABCD1234EFGH5678",
    "owner": {
      "userId": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "nickname": "User"
    },
    "settings": {
      "canShareInventory": false,
      "canShareTodos": false
    },
    "memberCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Validation error

Invalid request parameters

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `INVALID_HOME_ID`

Invalid homeId format

homeId must be 3\-30 characters, alphanumeric with hyphens

**Example:**

```json
{
  "error": "invalid_homeId",
  "message": "homeId must be 3-30 characters, alphanumeric with hyphens"
}
```

##### 400 - `NAME_REQUIRED`

Name is required

Name cannot be empty

**Example:**

```json
{
  "error": "name_required",
  "message": "name is required"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 100 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 100 characters or less"
}
```

##### 400 - `ADDRESS_TOO_LONG`

Address too long

Address must be 500 characters or less

**Example:**

```json
{
  "error": "address_too_long",
  "message": "address must be 500 characters or less"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 404 - `USER_NOT_FOUND`

User not found

Authenticated user does not exist

**Example:**

```json
{
  "error": "user_not_found",
  "message": "User not found"
}
```

##### 409 - `HOME_ID_EXISTS`

Home ID already exists

A home with this ID already exists \(excluding soft\-deleted homes\)

**Example:**

```json
{
  "error": "homeId_exists",
  "message": "A home with this ID already exists",
  "suggestedHomeId": "my-home-2"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.list`](#homes-list)
- [`homes.get`](#homes-get)
- [`homes.update`](#homes-update)
- [`homes.delete`](#homes-delete)
- [`homes.invitation.get`](#homes-invitation-get)

### GET /homes/:homeId/members

<a id="homes-list-members"></a>

**ID:** `homes.list_members`

**List all members of a home**

Retrieves a list of all members of a home, including the owner and regular members. Returns user details like email, nickname, avatar, role, and join date. User must be a member of the home to view members.

**Authentication:** Required (jwt)

**Tags:** `Homes`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The unique identifier of the home |

#### Query Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `includePending` | boolean | No | - | Whether to include pending members \(reserved for future use\) |

#### Response (200)

Members retrieved successfully

**Example:**

```json
{
  "members": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "email": "owner@example.com",
      "nickname": "Owner",
      "avatarUrl": "https://example.com/avatar.jpg",
      "role": "owner",
      "isOwner": true,
      "joinedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "userId": "507f1f77bcf86cd799439012",
      "email": "member@example.com",
      "nickname": "Member",
      "avatarUrl": "https://example.com/avatar2.jpg",
      "role": "member",
      "isOwner": false,
      "joinedAt": "2024-01-16T14:20:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Not a member of this home

User is not a member of the requested home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

No home exists with the provided homeId

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`homes.remove_member`](#homes-remove-member)
- [`homes.get`](#homes-get)


---

## Inventory Items

### GET /homes/:homeId/inventory/:inventoryId

<a id="inventory-items-get"></a>

**ID:** `inventory_items.get`

**Get details of a specific inventory item**

Retrieves detailed information about a specific inventory item. User must be a member of the home that contains the inventory item.

**Authentication:** Required (jwt)

**Tags:** `Inventory Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the inventory item |
| `inventoryId` | string | Yes | The unique identifier of the inventory item |

#### Response (200)

Inventory item details retrieved successfully

**Example:**

```json
{
  "inventoryItem": {
    "inventoryId": "milk-carton",
    "homeId": "my-home",
    "name": "Milk",
    "status": "new",
    "warningThreshold": 2,
    "categoryId": "dairy",
    "batches": [
      {
        "id": "batch-1",
        "amount": 1,
        "unit": "gallon",
        "expiryDate": "2024-02-01T00:00:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `INVENTORY_ID_REQUIRED`

inventoryId is required

The inventoryId path parameter must be provided

**Example:**

```json
{
  "error": "inventoryId_required",
  "message": "inventoryId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `INVENTORY_NOT_FOUND`

Inventory item not found

No inventory item exists with the provided inventoryId

**Example:**

```json
{
  "error": "inventory_not_found",
  "message": "Inventory item not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_items.create`](#inventory-items-create)
- [`inventory_items.list`](#inventory-items-list)
- [`inventory_items.update`](#inventory-items-update)
- [`inventory_items.delete`](#inventory-items-delete)

### PATCH /homes/:homeId/inventory/:inventoryId

<a id="inventory-items-update"></a>

**ID:** `inventory_items.update`

**Update an inventory item**

Updates specific fields of an existing inventory item. User must be a member of the home that contains the inventory item. Only fields provided in request body will be updated.

**Authentication:** Required (jwt)

**Tags:** `Inventory Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the inventory item |
| `inventoryId` | string | Yes | The unique identifier of the inventory item |

#### Request Body

**Content-Type:** `application/json`

Inventory item fields to update

**Required:** Yes

**Example:**

```json
{
  "name": "Organic Milk",
  "status": "using",
  "warningThreshold": 1,
  "categoryId": "dairy"
}
```

#### Response (200)

Inventory item updated successfully

**Example:**

```json
{
  "inventoryItem": {
    "inventoryId": "milk-carton",
    "homeId": "my-home",
    "name": "Organic Milk",
    "status": "using",
    "warningThreshold": 1,
    "categoryId": "dairy",
    "batches": [
      {
        "id": "batch-1",
        "amount": 1,
        "unit": "gallon",
        "expiryDate": "2024-02-01T00:00:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `INVENTORY_ID_REQUIRED`

inventoryId is required

The inventoryId path parameter must be provided

**Example:**

```json
{
  "error": "inventoryId_required",
  "message": "inventoryId is required"
}
```

##### 400 - `INVALID_NAME`

Invalid name

Name cannot be empty

**Example:**

```json
{
  "error": "invalid_name",
  "message": "name cannot be empty"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 200 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 200 characters or less"
}
```

##### 400 - `INVALID_STATUS`

Invalid status

status must be one of: using, new, out\-of\-stock, expired, en\-route

**Example:**

```json
{
  "error": "invalid_status",
  "message": "status must be one of: using, new, out-of-stock, expired, en-route"
}
```

##### 400 - `INVALID_WARNING_THRESHOLD`

Invalid warning threshold

warningThreshold must be a non\-negative number

**Example:**

```json
{
  "error": "invalid_warning_threshold",
  "message": "warningThreshold must be a non-negative number"
}
```

##### 400 - `INVALID_BATCHES`

Invalid batches

batches must be an array

**Example:**

```json
{
  "error": "invalid_batches",
  "message": "batches must be an array"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `INVENTORY_NOT_FOUND`

Inventory item not found

No inventory item exists with the provided inventoryId

**Example:**

```json
{
  "error": "inventory_not_found",
  "message": "Inventory item not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_items.create`](#inventory-items-create)
- [`inventory_items.list`](#inventory-items-list)
- [`inventory_items.get`](#inventory-items-get)
- [`inventory_items.delete`](#inventory-items-delete)

### DELETE /homes/:homeId/inventory/:inventoryId

<a id="inventory-items-delete"></a>

**ID:** `inventory_items.delete`

**Delete an inventory item**

Soft deletes an inventory item by setting deletedAt and deletedBy fields. User must be a member of the home that contains the inventory item. The inventory item remains in the database but is excluded from queries.

**Authentication:** Required (jwt)

**Tags:** `Inventory Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the inventory item |
| `inventoryId` | string | Yes | The unique identifier of the inventory item |

#### Response (200)

Inventory item deleted successfully

**Example:**

```json
{
  "success": true,
  "message": "Inventory item deleted successfully",
  "deletedAt": "2024-01-15T11:00:00.000Z"
}
```

#### Error Responses

##### 400 - `INVENTORY_ID_REQUIRED`

inventoryId is required

The inventoryId path parameter must be provided

**Example:**

```json
{
  "error": "inventoryId_required",
  "message": "inventoryId is required"
}
```

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `INVENTORY_NOT_FOUND`

Inventory item not found

No inventory item exists with the provided inventoryId

**Example:**

```json
{
  "error": "inventory_not_found",
  "message": "Inventory item not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_items.create`](#inventory-items-create)
- [`inventory_items.list`](#inventory-items-list)
- [`inventory_items.get`](#inventory-items-get)
- [`inventory_items.update`](#inventory-items-update)

### GET /homes/:homeId/inventory

<a id="inventory-items-list"></a>

**ID:** `inventory_items.list`

**List all inventory items for a home**

Retrieves a list of all inventory items for a home. User must be a member of home. Optionally filter by status.

**Authentication:** Required (jwt)

**Tags:** `Inventory Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to get inventory items from |

#### Response (200)

List of inventory items retrieved successfully

**Example:**

```json
{
  "inventoryItems": [
    {
      "inventoryId": "milk-carton",
      "homeId": "my-home",
      "name": "Milk",
      "status": "new",
      "warningThreshold": 2,
      "categoryId": "dairy",
      "batches": [
        {
          "id": "batch-1",
          "amount": 1,
          "unit": "gallon",
          "expiryDate": "2024-02-01T00:00:00.000Z",
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "createdBy": "507f1f77bcf86cd799439011",
      "updatedBy": "507f1f77bcf86cd799439011",
      "createdByDeviceId": null,
      "updatedByDeviceId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_items.create`](#inventory-items-create)
- [`inventory_items.get`](#inventory-items-get)
- [`inventory_items.update`](#inventory-items-update)
- [`inventory_items.delete`](#inventory-items-delete)

### POST /homes/:homeId/inventory

<a id="inventory-items-create"></a>

**ID:** `inventory_items.create`

**Create a new inventory item**

Creates a new inventory item in a home. The user must be a member of home. Each inventory item has a unique inventoryId within the home, name, status, and optional batches.

**Authentication:** Required (jwt)

**Tags:** `Inventory Items`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to create the inventory item in |

#### Request Body

**Content-Type:** `application/json`

Inventory item creation details

**Required:** Yes

**Example:**

```json
{
  "inventoryId": "milk-carton",
  "name": "Milk",
  "status": "new",
  "warningThreshold": 2,
  "batches": [
    {
      "id": "batch-1",
      "amount": 1,
      "unit": "gallon",
      "expiryDate": "2024-02-01T00:00:00.000Z"
    }
  ]
}
```

#### Response (201)

Inventory item created successfully

**Example:**

```json
{
  "inventoryItem": {
    "inventoryId": "milk-carton",
    "homeId": "my-home",
    "name": "Milk",
    "status": "new",
    "warningThreshold": 2,
    "categoryId": "dairy",
    "batches": [
      {
        "id": "batch-1",
        "amount": 1,
        "unit": "gallon",
        "expiryDate": "2024-02-01T00:00:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Validation error

Invalid request parameters

**Example:**

```json
{
  "error": "inventoryId_required",
  "message": "inventoryId is required"
}
```

##### 400 - `INVALID_INVENTORY_ID`

Invalid inventoryId format

inventoryId must be 4\-50 characters, alphanumeric with hyphens or underscores

**Example:**

```json
{
  "error": "invalid_inventory_id",
  "message": "inventoryId must be 4-50 characters, alphanumeric with hyphens or underscores"
}
```

##### 400 - `NAME_REQUIRED`

Name is required

Name cannot be empty

**Example:**

```json
{
  "error": "name_required",
  "message": "name is required"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 200 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 200 characters or less"
}
```

##### 400 - `INVALID_STATUS`

Invalid status

status must be one of: using, new, out\-of\-stock, expired, en\-route

**Example:**

```json
{
  "error": "invalid_status",
  "message": "status must be one of: using, new, out-of-stock, expired, en-route"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 409 - `INVENTORY_ID_EXISTS`

Inventory ID already exists

An inventory item with this ID already exists in this home

**Example:**

```json
{
  "error": "inventory_id_exists",
  "message": "An inventory item with this ID already exists in this home",
  "suggestedInventoryId": "milk-carton-2"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_items.list`](#inventory-items-list)
- [`inventory_items.get`](#inventory-items-get)
- [`inventory_items.update`](#inventory-items-update)
- [`inventory_items.delete`](#inventory-items-delete)


---

## Ai

### POST /ai/recognize-item

<a id="ai-recognize-item"></a>

**ID:** `ai.recognize_item`

**Recognize inventory item from image**

Uses AI to analyze an image and extract structured inventory item data. Returns item name, status, price, amount, and other relevant fields.

**Authentication:** This endpoint does NOT require authentication.

**Supported image formats:** JPEG, PNG, GIF, WebP (base64 encoded)

**Authentication:** Not required

**Tags:** `AI`

#### Request Body

**Content-Type:** `application/json`

Image data for item recognition

**Required:** Yes

**Example:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE..."
}
```

#### Response (200)

Item recognized successfully

**Example:**

```json
{
  "success": true,
  "item": {
    "id": "temp-123",
    "name": "Organic Milk",
    "status": "using",
    "price": 4.99,
    "amount": 1,
    "warningThreshold": 2,
    "expiryDate": "2024-02-01T00:00:00.000Z",
    "purchaseDate": "2024-01-15T00:00:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `NO_IMAGE_PROVIDED`

Image is required

The request must include a base64\-encoded image

**Example:**

```json
{
  "success": false,
  "error": "Image is required"
}
```

##### 500 - `AI_SERVICE_ERROR`

Failed to recognize item

The AI service returned an error or invalid response

**Example:**

```json
{
  "success": false,
  "error": "Failed to recognize item"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on the server

**Example:**

```json
{
  "success": false,
  "error": "Internal server error"
}
```


---

## Locations

### POST /homes/:homeId/locations

<a id="locations-create"></a>

**ID:** `locations.create`

**Create a new location**

Creates a new location in a home. The user must be a member of home. Each location has a unique locationId within the home, name, description, icon, and color.

**Authentication:** Required (jwt)

**Tags:** `Locations`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to create the location in |

#### Request Body

**Content-Type:** `application/json`

Location creation details

**Required:** Yes

**Example:**

```json
{
  "locationId": "kitchen",
  "name": "Kitchen",
  "description": "Main kitchen area",
  "icon": "kitchen",
  "color": "#FF5722"
}
```

#### Response (201)

Location created successfully

**Example:**

```json
{
  "location": {
    "locationId": "kitchen",
    "homeId": "my-home",
    "name": "Kitchen",
    "description": "Main kitchen area",
    "icon": "kitchen",
    "color": "#FF5722",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Validation error

Invalid request parameters

**Example:**

```json
{
  "error": "locationId_required",
  "message": "locationId is required"
}
```

##### 400 - `INVALID_LOCATION_ID`

Invalid locationId format

locationId must be 4\-50 characters, alphanumeric with hyphens or underscores

**Example:**

```json
{
  "error": "invalid_location_id",
  "message": "locationId must be 4-50 characters, alphanumeric with hyphens or underscores"
}
```

##### 400 - `NAME_REQUIRED`

Name is required

Name cannot be empty

**Example:**

```json
{
  "error": "name_required",
  "message": "name is required"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 200 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 200 characters or less"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 409 - `LOCATION_ID_EXISTS`

Location ID already exists

A location with this ID already exists in this home

**Example:**

```json
{
  "error": "location_id_exists",
  "message": "A location with this ID already exists in this home",
  "suggestedLocationId": "kitchen-2"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`locations.list`](#locations-list)
- [`locations.get`](#locations-get)
- [`locations.update`](#locations-update)
- [`locations.delete`](#locations-delete)

### GET /homes/:homeId/locations

<a id="locations-list"></a>

**ID:** `locations.list`

**List all locations for a home**

Retrieves a list of all locations for a home, sorted by creation date (oldest first). User must be a member of home.

**Authentication:** Required (jwt)

**Tags:** `Locations`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to get locations from |

#### Response (200)

List of locations retrieved successfully

**Example:**

```json
{
  "locations": [
    {
      "locationId": "kitchen",
      "homeId": "my-home",
      "name": "Kitchen",
      "description": "Main kitchen area",
      "icon": "kitchen",
      "color": "#FF5722",
      "createdBy": "507f1f77bcf86cd799439011",
      "updatedBy": "507f1f77bcf86cd799439011",
      "createdByDeviceId": null,
      "updatedByDeviceId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`locations.create`](#locations-create)
- [`locations.get`](#locations-get)
- [`locations.update`](#locations-update)
- [`locations.delete`](#locations-delete)

### DELETE /homes/:homeId/locations/:locationId

<a id="locations-delete"></a>

**ID:** `locations.delete`

**Delete a location**

Soft deletes a location by setting deletedAt and deletedBy fields. User must be a member of the home that contains the location. The location remains in the database but is excluded from queries.

**Authentication:** Required (jwt)

**Tags:** `Locations`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the location |
| `locationId` | string | Yes | The unique identifier of the location |

#### Response (200)

Location deleted successfully

**Example:**

```json
{
  "success": true,
  "message": "Location deleted successfully",
  "deletedAt": "2024-01-15T11:00:00.000Z"
}
```

#### Error Responses

##### 400 - `LOCATION_ID_REQUIRED`

locationId is required

The locationId path parameter must be provided

**Example:**

```json
{
  "error": "locationId_required",
  "message": "locationId is required"
}
```

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `LOCATION_NOT_FOUND`

Location not found

No location exists with the provided locationId

**Example:**

```json
{
  "error": "location_not_found",
  "message": "Location not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`locations.create`](#locations-create)
- [`locations.list`](#locations-list)
- [`locations.get`](#locations-get)
- [`locations.update`](#locations-update)

### PATCH /homes/:homeId/locations/:locationId

<a id="locations-update"></a>

**ID:** `locations.update`

**Update a location**

Updates specific fields of an existing location. User must be a member of the home that contains the location. Only fields provided in request body will be updated.

**Authentication:** Required (jwt)

**Tags:** `Locations`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the location |
| `locationId` | string | Yes | The unique identifier of the location |

#### Request Body

**Content-Type:** `application/json`

Location fields to update

**Required:** Yes

**Example:**

```json
{
  "name": "Kitchen - Updated",
  "description": "Updated kitchen description",
  "color": "#FF5722"
}
```

#### Response (200)

Location updated successfully

**Example:**

```json
{
  "location": {
    "locationId": "kitchen",
    "homeId": "my-home",
    "name": "Kitchen - Updated",
    "description": "Updated kitchen description",
    "icon": "kitchen",
    "color": "#FF5722",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `LOCATION_ID_REQUIRED`

locationId is required

The locationId path parameter must be provided

**Example:**

```json
{
  "error": "locationId_required",
  "message": "locationId is required"
}
```

##### 400 - `INVALID_NAME`

Invalid name

Name cannot be empty

**Example:**

```json
{
  "error": "invalid_name",
  "message": "name cannot be empty"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 200 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 200 characters or less"
}
```

##### 400 - `DESCRIPTION_TOO_LONG`

Description too long

Description must be 1000 characters or less

**Example:**

```json
{
  "error": "description_too_long",
  "message": "description must be 1000 characters or less"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `LOCATION_NOT_FOUND`

Location not found

No location exists with the provided locationId

**Example:**

```json
{
  "error": "location_not_found",
  "message": "Location not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`locations.create`](#locations-create)
- [`locations.list`](#locations-list)
- [`locations.get`](#locations-get)
- [`locations.delete`](#locations-delete)

### GET /homes/:homeId/locations/:locationId

<a id="locations-get"></a>

**ID:** `locations.get`

**Get details of a specific location**

Retrieves detailed information about a specific location. User must be a member of the home that contains the location.

**Authentication:** Required (jwt)

**Tags:** `Locations`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID that contains the location |
| `locationId` | string | Yes | The unique identifier of the location |

#### Response (200)

Location details retrieved successfully

**Example:**

```json
{
  "location": {
    "locationId": "kitchen",
    "homeId": "my-home",
    "name": "Kitchen",
    "description": "Main kitchen area",
    "icon": "kitchen",
    "color": "#FF5722",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `LOCATION_ID_REQUIRED`

locationId is required

The locationId path parameter must be provided

**Example:**

```json
{
  "error": "locationId_required",
  "message": "locationId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `LOCATION_NOT_FOUND`

Location not found

No location exists with the provided locationId

**Example:**

```json
{
  "error": "location_not_found",
  "message": "Location not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`locations.create`](#locations-create)
- [`locations.list`](#locations-list)
- [`locations.update`](#locations-update)
- [`locations.delete`](#locations-delete)


---

## Inventory Categories

### DELETE /homes/:homeId/inventory-categories/:categoryId

<a id="inventory-categories-delete"></a>

**ID:** `inventory_categories.delete`

**Delete an inventory category**

Soft deletes an inventory category. The category is marked as deleted but remains in the database. User must be a member of the home.

**Authentication:** Required (jwt)

**Tags:** `Inventory Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID |
| `categoryId` | string | Yes | The inventory category ID to delete |

#### Response (200)

Inventory category deleted successfully

**Example:**

```json
{
  "message": "Inventory category deleted successfully",
  "categoryId": "snacks"
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `CATEGORY_ID_REQUIRED`

categoryId is required

The categoryId path parameter must be provided

**Example:**

```json
{
  "error": "categoryId_required",
  "message": "categoryId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `CATEGORY_NOT_FOUND`

Category not found

The specified inventory category does not exist

**Example:**

```json
{
  "error": "category_not_found",
  "message": "Inventory category not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_categories.create`](#inventory-categories-create)
- [`inventory_categories.list`](#inventory-categories-list)
- [`inventory_categories.get`](#inventory-categories-get)
- [`inventory_categories.update`](#inventory-categories-update)

### GET /homes/:homeId/inventory-categories/:categoryId

<a id="inventory-categories-get"></a>

**ID:** `inventory_categories.get`

**Get a specific inventory category**

Retrieves a specific inventory category by categoryId. User must be a member of the home.

**Authentication:** Required (jwt)

**Tags:** `Inventory Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID |
| `categoryId` | string | Yes | The inventory category ID |

#### Response (200)

Inventory category retrieved successfully

**Example:**

```json
{
  "inventoryCategory": {
    "categoryId": "produce",
    "homeId": "my-home",
    "name": "Produce",
    "description": "Fresh fruits and vegetables",
    "color": "#4CAF50",
    "icon": "leaf",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 400 - `CATEGORY_ID_REQUIRED`

categoryId is required

The categoryId path parameter must be provided

**Example:**

```json
{
  "error": "categoryId_required",
  "message": "categoryId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `CATEGORY_NOT_FOUND`

Category not found

The specified inventory category does not exist

**Example:**

```json
{
  "error": "category_not_found",
  "message": "Inventory category not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_categories.create`](#inventory-categories-create)
- [`inventory_categories.list`](#inventory-categories-list)
- [`inventory_categories.update`](#inventory-categories-update)
- [`inventory_categories.delete`](#inventory-categories-delete)

### PATCH /homes/:homeId/inventory-categories/:categoryId

<a id="inventory-categories-update"></a>

**ID:** `inventory_categories.update`

**Update an inventory category**

Updates an existing inventory category. All fields are optional. User must be a member of the home.

**Authentication:** Required (jwt)

**Tags:** `Inventory Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID |
| `categoryId` | string | Yes | The inventory category ID to update |

#### Request Body

**Content-Type:** `application/json`

Inventory category update details

**Required:** Yes

**Example:**

```json
{
  "name": "Snacks & Treats",
  "description": "Chips, cookies, candy, and other treats",
  "color": "#FF9800",
  "icon": "cookie"
}
```

#### Response (200)

Inventory category updated successfully

**Example:**

```json
{
  "inventoryCategory": {
    "categoryId": "snacks",
    "homeId": "my-home",
    "name": "Snacks & Treats",
    "description": "Chips, cookies, candy, and other treats",
    "color": "#FF9800",
    "icon": "cookie",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Validation error

Invalid request parameters

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 100 characters or less"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 404 - `CATEGORY_NOT_FOUND`

Category not found

The specified inventory category does not exist

**Example:**

```json
{
  "error": "category_not_found",
  "message": "Inventory category not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_categories.create`](#inventory-categories-create)
- [`inventory_categories.list`](#inventory-categories-list)
- [`inventory_categories.get`](#inventory-categories-get)
- [`inventory_categories.delete`](#inventory-categories-delete)

### POST /homes/:homeId/inventory-categories

<a id="inventory-categories-create"></a>

**ID:** `inventory_categories.create`

**Create a new inventory category**

Creates a new inventory category in a home. The user must be a member of the home. Each inventory category has a unique categoryId within the home, a name, optional description, color, and icon.

**Authentication:** Required (jwt)

**Tags:** `Inventory Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to create the inventory category in |

#### Request Body

**Content-Type:** `application/json`

Inventory category creation details

**Required:** Yes

**Example:**

```json
{
  "categoryId": "snacks",
  "name": "Snacks",
  "description": "Chips, cookies, and other snacks",
  "color": "#FF5733",
  "icon": "cookie"
}
```

#### Response (201)

Inventory category created successfully

**Example:**

```json
{
  "inventoryCategory": {
    "categoryId": "snacks",
    "homeId": "my-home",
    "name": "Snacks",
    "description": "Chips, cookies, and other snacks",
    "color": "#FF5733",
    "icon": "cookie",
    "createdBy": "507f1f77bcf86cd799439011",
    "updatedBy": "507f1f77bcf86cd799439011",
    "createdByDeviceId": null,
    "updatedByDeviceId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

##### 400 - `VALIDATION_ERROR`

Validation error

Invalid request parameters

**Example:**

```json
{
  "error": "categoryId_required",
  "message": "categoryId is required"
}
```

##### 400 - `INVALID_CATEGORY_ID`

Invalid categoryId format

categoryId must be 4\-50 characters, alphanumeric with hyphens or underscores

**Example:**

```json
{
  "error": "invalid_category_id",
  "message": "categoryId must be 4-50 characters, alphanumeric with hyphens or underscores"
}
```

##### 400 - `NAME_REQUIRED`

Name is required

Name cannot be empty

**Example:**

```json
{
  "error": "name_required",
  "message": "name is required"
}
```

##### 400 - `NAME_TOO_LONG`

Name too long

Name must be 100 characters or less

**Example:**

```json
{
  "error": "name_too_long",
  "message": "name must be 100 characters or less"
}
```

##### 400 - `INVALID_COLOR`

Invalid color format

Color must be a valid hex color code

**Example:**

```json
{
  "error": "invalid_color",
  "message": "color must be a valid hex color code (e.g., #FF5733)"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 409 - `CATEGORY_ID_EXISTS`

Category ID already exists

An inventory category with this ID already exists in this home

**Example:**

```json
{
  "error": "category_id_exists",
  "message": "An inventory category with this ID already exists in this home",
  "suggestedCategoryId": "snacks-2"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_categories.list`](#inventory-categories-list)
- [`inventory_categories.get`](#inventory-categories-get)
- [`inventory_categories.update`](#inventory-categories-update)
- [`inventory_categories.delete`](#inventory-categories-delete)

### GET /homes/:homeId/inventory-categories

<a id="inventory-categories-list"></a>

**ID:** `inventory_categories.list`

**List all inventory categories for a home**

Retrieves a list of all inventory categories for a home. User must be a member of the home. Categories are ordered by creation time.

**Authentication:** Required (jwt)

**Tags:** `Inventory Categories`

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `homeId` | string | Yes | The home ID to get inventory categories from |

#### Response (200)

List of inventory categories retrieved successfully

**Example:**

```json
{
  "inventoryCategories": [
    {
      "categoryId": "produce",
      "homeId": "my-home",
      "name": "Produce",
      "description": "Fresh fruits and vegetables",
      "color": "#4CAF50",
      "icon": "leaf",
      "createdBy": "507f1f77bcf86cd799439011",
      "updatedBy": "507f1f77bcf86cd799439011",
      "createdByDeviceId": null,
      "updatedByDeviceId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

##### 400 - `HOME_ID_REQUIRED`

homeId is required

The homeId path parameter must be provided

**Example:**

```json
{
  "error": "homeId_required",
  "message": "homeId is required"
}
```

##### 401 - `UNAUTHORIZED`

Unauthorized

No authentication token provided

**Example:**

```json
{
  "message": "Unauthorized"
}
```

##### 403 - `FORBIDDEN`

Forbidden

User is not a member of this home

**Example:**

```json
{
  "error": "forbidden",
  "message": "Not a member of this home"
}
```

##### 404 - `HOME_NOT_FOUND`

Home not found

The specified home does not exist

**Example:**

```json
{
  "error": "home_not_found",
  "message": "Home not found"
}
```

##### 500 - `SERVER_ERROR`

Internal server error

An unexpected error occurred on server

**Example:**

```json
{
  "message": "Internal server error"
}
```

**Related Endpoints:**

- [`inventory_categories.create`](#inventory-categories-create)
- [`inventory_categories.get`](#inventory-categories-get)
- [`inventory_categories.update`](#inventory-categories-update)
- [`inventory_categories.delete`](#inventory-categories-delete)


---

## Debug

### GET /debugz

<a id="debug-get-debugz"></a>

**ID:** `debug.get_debugz`

**Interactive API Debug Dashboard**

Renders a Postman-like UI for testing API endpoints. Automatically populates with handler metadata. Allows setting auth tokens and sending requests to test the API. Only available in non-production environments.

**Authentication:** Not required

**Tags:** `Debug`

#### Response (200)

Returns HTML debug dashboard

#### Error Responses

##### 404 - `NOT_FOUND`

Debug endpoint not available in production

The debug endpoint is disabled in production mode

**Example:**

```json
{
  "message": "Not Found"
}
```

### POST /debugz/proxy

<a id="debug-proxy-debugz-request"></a>

**ID:** `debug.proxy_debugz_request`

**Proxy requests to API endpoints**

Proxies requests from the debug UI to actual API endpoints. Allows testing endpoints with custom auth tokens. Only available in non-production environments.

**Authentication:** Not required

**Tags:** `Debug`

#### Query Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `method` | string | No | - | HTTP method to use \(default: GET\) |
| `path` | string | Yes | - | API endpoint path to proxy to |

#### Request Body

**Content-Type:** `application/json`

Request configuration

**Required:** Yes

**Example:**

```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requestBody": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

#### Response (200)

Proxied response

#### Error Responses

##### 400 - `BAD_REQUEST`

Target path is required

The path query parameter is required

##### 404 - `NOT_FOUND`

Debug endpoint not available in production

The debug endpoint is disabled in production mode

##### 500 - `PROXY_ERROR`

Failed to proxy request

An error occurred while proxying the request

**Related Endpoints:**

- [`debug.get_debugz`](#debug-get-debugz)
- [`debug.get_debugz_api`](#debug-get-debugz-api)

### GET /debugz/api

<a id="debug-get-debugz-api"></a>

**ID:** `debug.get_debugz_api`

**Get handler metadata for debug UI**

Returns all registered handler metadata organized by category. Used by the debug dashboard to populate the endpoint list. Only available in non-production environments.

**Authentication:** Not required

**Tags:** `Debug`

#### Response (200)

Handler metadata organized by category

#### Error Responses

##### 404 - `NOT_FOUND`

Debug endpoint not available in production

The debug endpoint is disabled in production mode

**Example:**

```json
{
  "message": "Not Found"
}
```

**Related Endpoints:**

- [`debug.get_debugz`](#debug-get-debugz)


---

## Invitations


---

---

*Documentation generated from 51 endpoints*
