# Airtable Setup

Create these three tables in base `appLFfeTpwkYcWOrn`.

## Users

Fields:
- `Name`
- `User ID`
- `Login ID`
- `Password`
- `Role` (`user`, `super-user`, or `admin`; new users default to `user`)
- `Color`
- `Created At`

## Projects

Fields:
- `Name`
- `Project ID`
- `Color`
- `Favorite`
- `Pinned`
- `Updated At`

## Time Entries

Fields:
- `Name`
- `Entry ID`
- `User ID`
- `User Name`
- `Project ID`
- `Project Name`
- `Project Color`
- `Start Time`
- `End Time`
- `Duration`
- `Date`
- `Notes`
- `Status`
- `Updated At`

## Local Environment

Copy `clockfy/client/.env.example` to `clockfy/client/.env`, then add your Airtable personal access token:

```env
VITE_AIRTABLE_BASE_ID=appLFfeTpwkYcWOrn
VITE_AIRTABLE_TOKEN=pat_your_airtable_personal_access_token
```

The app seeds default users and starter projects when the Airtable tables are empty. Time entries start empty.
