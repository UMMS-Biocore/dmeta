************
Introduction
************

Dmeta could be run as a standalone application using npm and nodejs.

Initial Setup:
==============

1. Clone Dmeta repository::

    git clone https://github.com/UMMS-Biocore/dmeta.git
    cd dmeta
   

2. Create certificate for HTTPS protocol by running following commands::

    mkdir -p certs
    openssl genrsa -out certs/privatekey.pem 2048
    openssl req -new -key certs/privatekey.pem -out certs/certrequest.csr
    openssl x509 -req -in certs/certrequest.csr -signkey certs/privatekey.pem -out certs/certificate.pem


3. Copy `docs/templates/template.config.env` to parent directory as `config.env` and adjust its parameters::

    cp docs/templates/template.config.env config.env

4. Insert initial database. Test user credentials will be: ``username:test`` and ``password:secret``::


    mongorestore -d dmeta-skin db/dmeta-skin/


5. Install node modules using npm:: 
    
    npm install

6. Starting MongoDB and Node.js Server::

    mongod
    npm run start

7. Now, you can open your browser to access Dmeta using the url below::

    https://localhost:4000


Configuration of the config.env file
------------------------------------

This is the main configuration file and contains the following configuration directives:

Base settings:
~~~~~~~~~~~~~~

* **NODE_ENV:** Valid options:``development`` or ``production``
* **PROTOCOL:** Valid options:``http`` or ``https``. If you enable SSO_LOGIN, PROTOCOL must be set to https. 
* **PORT:** Port for BASE_URL (e.g. ``3000``)
* **BASE_URL:** Long version of the base URL (e.g. ``https://localhost:4000``)
* **DATABASE_LOCAL:** Database URI for connection (e.g ``mongodb://localhost:27017/dmeta-skin``)

JWT Tokens, Session and Cookies:
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* **SESSION_SECRET:** my-ultra-secure-password
* **JWT_SECRET:** my-ultra-secure-and-ultra-long-secret
* **JWT_EXPIRES_IN:** The allowed time in days for expiration of token. (e.g. 90)
* **JWT_COOKIE_EXPIRES_IN:** The allowed time in days for expiration of token. (e.g. 90)
* **TIME_TO_CHECK_EXPIRED_TOKENS:** The time in seconds to check the database for expired tokens (e.g. 3600)

Certificates:
~~~~~~~~~~~~~

If you enable SSO_LOGIN, or set https as PROTOCOL then certificate and private key should be defined. 

* **CERTS_PRIVATE_KEY:** certificate private key path (e.g. ``certs/privatekey.pem``)
* **CERTS_CERTIFICATE:** certificate path (e.g. ``certs/certificate.pem``)

The SSO Authorization server:
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* **SSO_LOGIN:** Valid options:``true`` or ``false``
* **SSO_URL:** If SSO_LOGIN is enabled, the URL of SSO server. (e.g. ``https://localhost:3000``)
* **SSO_REDIRECT_URL:** If SSO_LOGIN is enabled, redirect url after successful SSO login. (e.g. ``https://localhost:4000/receivetoken``)
* **SSO_USER_INFO_URL:** SSO token info end point: (e.g. ``https://localhost:3000/api/v1/users/info``)
* **CLIENT_ID:** If SSO_LOGIN is enabled, client id should be taken from SSO server. (e.g. ``dmeta-d3211ddg``)
* **CLIENT_SECRET:** If SSO_LOGIN is enabled, client secret should be taken from SSO server. (e.g. ``dmeta-facas3xffcxc0ad3``)
