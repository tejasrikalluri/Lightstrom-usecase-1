## Lightstorm Use Case 1

• When an Agent updates a parent Incident ticket property and clicks the ‘Update’ button, custom app will identify the ticket property field(s) updated in the parent ticket and update these property fields in associated child ticket(s).
• When an Agent updates a child ticket property and clicks the ‘Update’ button, custom app will identify the ticket property fields updated in the child ticket and update these property fields in the parent ticket.

### Files and Folders
    .
    ├── README.md                     A file for your future self and developer friends to learn about app
    ├── app                           A folder to put all files needed for frontend components
    │   ├── index.html                A landing page for the user to use the app
    │   ├── scripts                   JavaScript to handle app's frontend components business logic
    │   │   └── app.js
    │   └── styles                    A folder of all the styles for app
    │       ├── images                A folder to put all the images
    │       │   ├── icon.svg
    │       │   └── rocket.svg
    │       └── style.css
    ├── config                        A folder to hold all the app's configuration files
    │   └── iparams.json
    └── manifest.json                 A JSON file holding meta data for app to run on platform

Explore [more of app sample codes](https://github.com/freshworks/marketplace-sample-apps) on the Freshworks Github respository.
