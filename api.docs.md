# gen-test server.js API docs

This server and API gives REST like access to the MySQL database `redmugapi`.
Authoritatively evolve technically sound infrastructures via intuitive total linkage. Globally maintain standardized ROI vis-a-vis sustainable.

<br><br>

## /api/users

Returns all users

```Text
# method                      GET
# authentication              Y
# example                     /api/users
# parameters                  none
```

```
# body                        none
```

```Text
# response (collection)
{
	"status": "success",
	"data": {
		"users": [{
				"id": 1,
				"email": "someone@redmug.dev",
				"role": "superuser"
			},
			{
				"id": 2,
				"email": "support@redmug.dev",
				"role": "user"
			}
		]
	}
}
```

```Text
## curl
curl  -X Get http://localhost:3005/api/users
```

> **Notes:**
> Efficiently disseminate distributed synergy through dynamic architectures. Efficiently administrate professional communities via reliable e-business. Globally harness B2B metrics through exceptional value.

<br><hr>

<br><br>

## /api/user/:id

Returns user record where id = [int]

```Text
# method                      GET
# authentication              Y
# example                     /api/user/1
# parameters                  none
```

```Text
# body                        none
```

```Text
# success response
{
	"status": "success",
	"data": {
		"user": {
				"id": 1,
				"email": "someone@redmug.dev",
				"role": "superuser"
			}
	}
}
```

```Text
# fail response
{
	"status": "fail",
	"data": {
		"message": "no user found matching id"
	}
}
```

```Text
# curl
curl  -X Get http://localhost:3005/api/users
```

> **Notes:**
> Efficiently disseminate distributed synergy through dynamic architectures. Efficiently administrate professional communities via reliable e-business. Globally harness B2B metrics through exceptional value.

<hr>

<br><br>

## /api/adduser

Add a user

```Text
# method                      POST
# authentication              Y
# example                     /api/adduser
# parameters                  none
```

```Text
# body                        Content-Type: application/json
{
	"display_name": "Robert Collins",
	"email": "rcollins@redmug.dev",
	"client_id": 1,
	"user_status": 0,
	"last_login": "2000-01-01 00:00:00",
	"role": "superuser"
}
```

```Text
# success response
{
	"status": "success",
	"data": {
		"user": {}
	}
}
```

```Text
# fail response
{
	"status": "fail",
	"data": {
		"message": "no user found matching id"
	}
}
```

```Text
# curl
curl -d '[{"display_name": "Route Two",	"email": "rcollins@redmug.dev",	"client_id": 1,	"user_status": 0, "last_login": "2000-01-01 00:00:00",	"role": "superuser" }]' -H "Content-Type: application/json" -X POST http://localhost:3005/api/adduser
```

> **Notes:**
> Efficiently disseminate distributed synergy through dynamic architectures. Efficiently administrate professional communities via reliable e-business. Globally harness B2B metrics through exceptional value.

<hr>
