npm i -g firebase-tools

firebase serve --only "functions,hosting"

npm install --save firebase-functions@latest //don't use if not asked in terminal

**TO DOs:**

**user side** (optional)
- in monitoring form, when it is not yet the specific day, it should be read-only
- "are you sure you want to save this?" in every save btn
- if 'no symptoms' is checked, symptoms checkboxes should be read only (and vice versa)

**general**
- clinic should be the one who should have the "complete" button (to clear user) in the monitoring form, only submit for users (save btn)
    * done btn (refresher) --> "clear" --> "cleared" text

**notes**
- !! IMPT !! specify only 1 admin in document for defense
- archive is not positive logs
- ?id -> request.query.id
- calling &hello=hi