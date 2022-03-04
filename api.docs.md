## **Title**

<_Additional information about your API call. Try to use verbs that match both request type (fetching vs modifying) and plurality (one vs multiple)._>

- **URL**

  <_The URL Structure (path only, no root url)_>

- **Method:**

  <_The request type_>

  `GET` | `POST` | `DELETE` | `PUT`

- **URL Params**

  <_If URL params exist, specify them in accordance with name mentioned in URL section. Separate into optional and required. Document data constraints._>

  **Required:**

  `id=[integer]`

  **Optional:**

  `photo_id=[alphanumeric]`

- **Data Params**

  <_If making a post request, what should the body payload look like? URL Params rules apply here too._>

- **Success Response:**

  <_What should the status code be on success and is there any returned data? This is useful when people need to to know what their callbacks should expect!_>

  - **Code:** 200 <br />
    **Content:** `{ id : 12 }`

- **Error Response:**

  <_Most endpoints will have many ways they can fail. From unauthorized access, to wrongful parameters etc. All of those should be liste d here. It might seem repetitive, but it helps prevent assumptions from being made where they should be._>

  - **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "Log in" }`

  OR

  - **Code:** 422 UNPROCESSABLE ENTRY <br />
    **Content:** `{ error : "Email Invalid" }`

- **Sample Call:**

  <_Just a sample call to your endpoint in a runnable format ($.ajax call or a curl request) - this makes life easier and more predictable._>

- **Notes:**

  <_This is where all uncertainties, commentary, discussion etc. can go. I recommend timestamping and identifying oneself when leaving comments here._>

<hl>

## **Show User**

Returns json data about a single user.

- **URL**

  /users/:id

- **Method:**

  `GET`

- **URL Params**

  **Required:**

  `id=[integer]`

- **Data Params**

  None

- **Success Response:**

  - **Code:** 200 <br />
    **Content:** `{ id : 12, name : "Michael Bloom" }`

- **Error Response:**

  - **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "User doesn't exist" }`

  OR

  - **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`

- **Sample Call:**

  ```javascript
  $.ajax({
    url: '/users/1',
    dataType: 'json',
    type: 'GET',
    success: function (r) {
      console.log(r)
    },
  })
  ```

  https://github.com/jamescooke/restapidocs/blob/master/examples/user/get.md

https://github.com/jamescooke/restapidocs/blob/master/examples/user/get.md

# Show Current User

Get the details of the currently Authenticated User along with basic
subscription information.

**URL** : `/api/user/`

**Method** : `GET`

**Auth required** : YES

**Permissions required** : None

## Success Response

**Code** : `200 OK`

**Content examples**

For a User with ID 1234 on the local database where that User has saved an
email address and name information.

```json
{
  "id": 1234,
  "first_name": "Joe",
  "last_name": "Bloggs",
  "email": "joe25@example.com"
}
```

For a user with ID 4321 on the local database but no details have been set yet.

```json
{
  "id": 4321,
  "first_name": "",
  "last_name": "",
  "email": ""
}
```

## Notes

- If the User does not have a `UserInfo` instance when requested then one will
  be created for them.

<div style="page-break-after: always"></div>

# Update Current User

Allow the Authenticated User to update their details.

**URL** : `/api/user/`

**Method** : `PUT`

**Auth required** : YES

**Permissions required** : None

**Data constraints**

```json
{
  "first_name": "[1 to 30 chars]",
  "last_name": "[1 to 30 chars]"
}
```

Note that `id` and `email` are currently read only fields.

**Header constraints**

The application used to update the User's information can be sent in the
header. Values passed in the `UAPP` header only pass basic checks for validity:

- If 0 characters, or not provided, ignore.
- If 1 to 8 characters, save.
- If longer than 8 characters, ignore.

```
UAPP: [1 to 8 chars]
```

**Data examples**

Partial data is allowed.

```json
{
  "first_name": "John"
}
```

Empty data can be PUT to erase the name, in this case from the iOS application
version 1.2:

```
UAPP: ios1_2
```

```json
{
  "last_name": ""
}
```

## Success Responses

**Condition** : Data provided is valid and User is Authenticated.

**Code** : `200 OK`

**Content example** : Response will reflect back the updated information. A
User with `id` of '1234' sets their name, passing `UAPP` header of 'ios1_2':

```json
{
  "id": 1234,
  "first_name": "Joe",
  "last_name": "Bloggs",
  "email": "joe25@example.com",
  "uapp": "ios1_2"
}
```

## Error Response

**Condition** : If provided data is invalid, e.g. a name field is too long.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
  "first_name": ["Please provide maximum 30 character or empty string"]
}
```

## Notes

- Endpoint will ignore irrelevant and read-only data such as parameters that
  don't exist, or fields that are not editable like `id` or `email`.
- Similar to the `GET` endpoint for the User, if the User does not have a
  UserInfo instance, then one will be created for them.
