A feed of the lastest content from FT.com in Node.js
===

To run locally
---

Create a .env file and add:

	CAPI_KEY={yourCapiKey}

Then run

	npm install
	node server/app.js

To deploy to Heroku
---

As above, plus

    heroku create {mySensibleAppName}
    git push heroku master
