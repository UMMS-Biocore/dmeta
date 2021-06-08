API v1
======

Dmeta API uses :abbr:`REST (Representational State Transfer)`.
JSON is returned by all API responses including errors
and HTTP response status codes are to designate success and failure.

.. contents:: Table of contents
   :local:
   :backlinks: none
   :depth: 3


Authentication and authorization
--------------------------------

Requests to the Dmeta API are for public and private information. All endpoints require authentication.


User Login
~~~~~~~~~~

After getting the access token, users can make a request to the Dmeta API with the ``Authorization`` HTTP header. It can be specified with ``Bearer <your-access-token>``
to authenticate as a user and have the same permissions that the user itself.

.. http:post:: {{URL}}/api/v1/users/login

    Retrieve an access token for the current logged in user.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X POST 'https://dmeta-skin.dolphinnext.com/api/v1/users/login' \
        -H 'Content-Type: application/json' \
        -d '
            {
                "email":"your-email@mail.com",
                "password":"your-password"
            }'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "token": "eyJhbGciOiJSUz....",
            "data": {
                "user": {
                    "role": "user",
                    "_id": "b6c9a200168a225f39add38d",
                    "email": "your-email@mail.com",
                    "name": "test user",
                    "scope": "*",
                    "username": "yukseleo"
                }
            }
        }



Projects
--------------------------------

Get All Projects 
~~~~~~~~~~~~~~~~

.. http:get:: {{URL}}/api/v1/projects

    Retrieve a list of all the projects for the current logged in user.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET 'https://dmeta-skin.dolphinnext.com/api/v1/projects' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "results": 1,
            "data": {
                "data": [
                    {
                        "active": true,
                        "creationDate": "2020-11-17T19:36:49.048Z",
                        "lastUpdateDate": "2020-11-17T19:36:49.048Z",
                        "_id": "5fb2b395c8c1e577fcb8ce6c",
                        "restrictTo": {
                            "role": [
                                "admin"
                            ]
                        },
                        "name": "vitiligo",
                        "label": "Vitiligo",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "slug": "vitiligo",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        },
                    }
                ]
            }
        }

 



Get a Project 
~~~~~~~~~~~~~

.. http:get:: /api/v1/projects/(string:project_id)

    Retrieve details of a single project.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET \
        'https://dmeta-skin.dolphinnext.com/api/v1/projects/5fb2b395c8c1e577fcb8ce6c' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "results": 1,
            "data": {
                "data": [
                    {
                        "active": true,
                        "creationDate": "2020-11-17T19:36:49.048Z",
                        "lastUpdateDate": "2020-11-17T19:36:49.048Z",
                        "_id": "5fb2b395c8c1e577fcb8ce6c",
                        "restrictTo": {
                            "role": [
                                "admin"
                            ]
                        },
                        "name": "vitiligo",
                        "label": "Vitiligo",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "slug": "vitiligo",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        },
                    }
                ]
            }
        }


Create a Project 
~~~~~~~~~~~~~~~~

.. http:post:: /api/v1/projects/

    This post request is only allowed for the admin role.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X POST \
        'https://dmeta-skin.dolphinnext.com/api/v1/projects' \
        -H 'Authorization: Bearer <your-access-token>' \
        -H 'Content-Type: application/json' \
        -d '
            {
                "name": "vitiligo",
                "label": "Vitiligo"
            }'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": {
                    "active": true,
                    "creationDate": "2021-03-31T02:04:27.474Z",
                    "lastUpdateDate": "2021-03-31T02:04:27.474Z",
                    "_id": "6063dbcfa50bb5fa9eb9cfba",
                    "name": "vitiligo",
                    "label": "Vitiligo",
                    "lastUpdatedUser": "5f39add38db6c9a200168a22",
                    "owner": "5f39add38db6c9a200168a22",
                    "slug": "vitiligo",
                }
            }
        }


Update a Project 
~~~~~~~~~~~~~~~~

.. http:patch:: /api/v1/projects/(string:project_id)

    Update an existing project.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X PATCH \
          -H "Authorization: Bearer <token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/projects/5fb2b395c8c1e577fcb8ce6c \
          -H "Content-Type: application/json" \
          -d '
              {
                "slug": "vit"
              }'
    
    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": {
                    "active": true,
                    "creationDate": "2020-11-17T19:36:49.048Z",
                    "lastUpdateDate": "2020-11-17T19:36:49.048Z",
                    "_id": "5fb2b395c8c1e577fcb8ce6c",
                    "restrictTo": {
                        "role": [
                            "admin"
                        ]
                    },
                    "name": "vitiligo",
                    "label": "Vitiligo",
                    "lastUpdatedUser": "5f39add38db6c9a200168a22",
                    "owner": "5f39add38db6c9a200168a22",
                    "slug": "vit",
                    "perms": {
                        "read": {
                            "group": [
                                "5fb4575faa5adff6f407f2d1"
                            ]
                        },
                        "write": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        }
                    }
                }
            }
        }

Delete a Project 
~~~~~~~~~~~~~~~~

.. http:delete:: /api/v1/projects/(string:project_id)

    Deleting an existing project.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X DELETE \
          -H "Authorization: Bearer <token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/projects/5fb2b395c8c1e577fcb8ce6c 
 
    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "doc": "Deleted!"
            }
        }


Collections
--------------------------------

Get All Collections 
~~~~~~~~~~~~~~~~~~~

.. http:get:: {{URL}}/api/v1/collections

    Retrieve a list of all the collections for the current logged in user.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET 'https://dmeta-skin.dolphinnext.com/api/v1/collections' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {"status": "success",
            "results": 10,
            "data": {
                "data": [
                    {
                        "parentCollectionID": null,
                        "version": 1,
                        "required": false,
                        "active": true,
                        "creationDate": "2020-09-08T21:56:35.301Z",
                        "lastUpdateDate": "2020-09-08T21:56:35.301Z",
                        "_id": "5f57ffba35db5980ba020ff3",
                        "restrictTo": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        },
                        "name": "exp_series",
                        "label": "Experiment Series",
                        "slug": "exp_series",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "projectID": "5fb2b395c8c1e577fcb8ce6c",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        },
                        "id": "5f57ffba35db5980ba020ff3"
                    },
                    {
                        "parentCollectionID": "5f57ffba35db5980ba020ff3",
                        "version": 1,
                        "required": false,
                        "active": true,
                        "creationDate": "2020-09-08T21:56:35.301Z",
                        "lastUpdateDate": "2020-09-08T21:56:35.301Z",
                        "_id": "5f57ffe635db5980ba020ff4",
                        "restrictTo": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        },
                        "name": "exp",
                        "label": "Experiments",
                        "slug": "exp",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "projectID": "5fb2b395c8c1e577fcb8ce6c",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        },
                        "id": "5f57ffe635db5980ba020ff4"
                    }]
            }
        }

 



Get a Collection 
~~~~~~~~~~~~~~~~

.. http:get:: /api/v1/collections/(string:collection_id)

    Retrieve details of a single collection.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET \
        'https://dmeta-skin.dolphinnext.com/api/v1/collections/5f57ffe635db5980ba020ff4' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": [
                    {
                        "parentCollectionID": "5f57ffba35db5980ba020ff3",
                        "version": 1,
                        "required": false,
                        "active": true,
                        "creationDate": "2020-09-08T21:56:35.301Z",
                        "lastUpdateDate": "2020-09-08T21:56:35.301Z",
                        "_id": "5f57ffe635db5980ba020ff4",
                        "restrictTo": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        },
                        "name": "exp",
                        "label": "Experiments",
                        "slug": "exp",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "projectID": "5fb2b395c8c1e577fcb8ce6c",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        }
                    }
                ]
            }
        }


Create a Collection 
~~~~~~~~~~~~~~~~~~~

.. http:post:: /api/v1/collections/

    This post request is only allowed for the project-admin role.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X POST \
        'https://dmeta-skin.dolphinnext.com/api/v1/collections' \
        -H 'Authorization: Bearer <your-access-token>' \
        -H 'Content-Type: application/json' \
        -d '
            {
                "name": "analysis",
                "label": "Analysis",
                "slug": "analysis",
                "projectID":"5fb2b395c8c1e577fcb8ce6c",
                "restrictTo": {"group":["5fb45793aa5adff6f407f2d2"]},
                "parentCollectionID":"5f74a0e05443973d2bfd870c"
            }'

    **Example response**:

    .. sourcecode:: json

            {
                "status": "success",
                "data": {
                    "data": {
                        "parentCollectionID": "5f74a0e05443973d2bfd870c",
                        "version": 1,
                        "required": false,
                        "active": true,
                        "creationDate": "2021-03-31T02:26:17.087Z",
                        "lastUpdateDate": "2021-03-31T02:26:17.087Z",
                        "_id": "6063e3a33c195afbe6d5e036",
                        "name": "analysis",
                        "label": "Analysis",
                        "slug": "analysis",
                        "restrictTo": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        },
                        "projectID": "5fb2b395c8c1e577fcb8ce6c",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        }
                    }
                }
            }


Update a Collection
~~~~~~~~~~~~~~~~~~~

.. http:patch:: /api/v1/collections/(string:collection_id)

    Update an existing collection.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X PATCH \
          -H "Authorization: Bearer <your-access-token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/collections/6063e3a33c195afbe6d5e036 \
          -H "Content-Type: application/json" \
          -d '
              {
                "slug": "anlys"
              }'
    
    **Example response**:

    .. sourcecode:: json

            {
                "status": "success",
                "data": {
                    "data": {
                        "parentCollectionID": "5f74a0e05443973d2bfd870c",
                        "version": 1,
                        "required": false,
                        "active": true,
                        "creationDate": "2021-03-31T02:26:17.087Z",
                        "lastUpdateDate": "2021-03-31T02:26:17.087Z",
                        "_id": "6063e3a33c195afbe6d5e036",
                        "name": "analysis",
                        "label": "Analysis",
                        "slug": "anlys",
                        "restrictTo": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        },
                        "projectID": "5fb2b395c8c1e577fcb8ce6c",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        }
                    }
                }
            }

Delete a Collection 
~~~~~~~~~~~~~~~~~~~

.. http:delete:: /api/v1/collections/(string:collection_id)

    Deleting an existing collection.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X DELETE \
          -H "Authorization: Bearer <your-access-token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/collections/6063e3a33c195afbe6d5e036 
 
    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "doc": "Deleted!"
            }
        }
        

Fields
------

Get All Fields 
~~~~~~~~~~~~~~~~~~~

.. http:get:: {{URL}}/api/v1/fields

    Retrieve a list of fields for the current logged in user.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET 'https://dmeta-skin.dolphinnext.com/api/v1/fields' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "results": 2,
            "data": {
                "data": [
                    {
                        "type": "String",
                        "required": true,
                        "active": true,
                        "creationDate": "2020-09-08T21:56:35.406Z",
                        "lastUpdateDate": "2020-09-08T21:56:35.406Z",
                        "_id": "5f58518835db5980ba020ff7",
                        "name": "name",
                        "label": "Name",
                        "collectionID": "5f57ffba35db5980ba020ff3",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        },
                        "unique": true
                    },
                    {
                        "type": "String",
                        "required": false,
                        "active": true,
                        "creationDate": "2020-09-08T21:56:35.406Z",
                        "lastUpdateDate": "2020-09-08T21:56:35.406Z",
                        "_id": "5f58559f35db5980ba020ff8",
                        "name": "design",
                        "label": "Design",
                        "collectionID": "5f57ffba35db5980ba020ff3",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        }
                    }]
                }
            }

 



Get a Field 
~~~~~~~~~~~

.. http:get:: /api/v1/fields/(string:field_id)

    Retrieve details of a single field.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET \
        'https://dmeta-skin.dolphinnext.com/api/v1/fields/5f58559f35db5980ba020ff8' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": [
                    {
                        "type": "String",
                        "required": false,
                        "active": true,
                        "creationDate": "2020-09-08T21:56:35.406Z",
                        "lastUpdateDate": "2020-09-08T21:56:35.406Z",
                        "_id": "5f58559f35db5980ba020ff8",
                        "name": "design",
                        "label": "Design",
                        "collectionID": "5f57ffba35db5980ba020ff3",
                        "lastUpdatedUser": "5f39add38db6c9a200168a22",
                        "owner": "5f39add38db6c9a200168a22",
                        "perms": {
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            },
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            }
                        }
                    }
                ]
            }
        }


Create a Field 
~~~~~~~~~~~~~~

.. http:post:: /api/v1/fields/

    This post request is only allowed for the project-admin role.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X POST \
        'https://dmeta-skin.dolphinnext.com/api/v1/fields' \
        -H 'Authorization: Bearer <your-access-token>' \
        -H 'Content-Type: application/json' \
        -d '
            {
                "name": "clin_pheno",
                "label": "Clinical Phenotype",
                "type": "String",
                "collectionID":"5f74a0e05443973d2bfd870c"
            }'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": {
                    "type": "String",
                    "required": false,
                    "active": true,
                    "creationDate": "2021-03-31T02:57:02.771Z",
                    "lastUpdateDate": "2021-03-31T02:57:02.771Z",
                    "_id": "6063e7c91bfc89fd1960ae5b",
                    "name": "clin_pheno",
                    "label": "Clinical Phenotype",
                    "collectionID": "5f74a0e05443973d2bfd870c",
                    "lastUpdatedUser": "5f39add38db6c9a200168a22",
                    "owner": "5f39add38db6c9a200168a22",
                    "perms": {
                        "read": {
                            "group": [
                                "5fb4575faa5adff6f407f2d1"
                            ]
                        },
                        "write": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        }
                    },
                    "id": "6063e7c91bfc89fd1960ae5b"
                }
            }
        }


Update a Field
~~~~~~~~~~~~~~

.. http:patch:: /api/v1/fields/(string:field_id)

    Update an existing field.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X PATCH \
          -H "Authorization: Bearer <your-access-token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/fields/6063e7c91bfc89fd1960ae5b \
          -H "Content-Type: application/json" \
          -d '
              {
                "ontology": {
                    "create": true,
                    "include": [
                        "Dermatomyositis",
                        "GVHD",
                        "Healthy Control",
                        "Lupus",
                        "Psoriasis",
                        "Vitiligo"
                    ]
                }
              }'
    
    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": {
                    "type": "String",
                    "required": false,
                    "active": true,
                    "creationDate": "2021-03-31T02:57:02.771Z",
                    "lastUpdateDate": "2021-03-31T02:57:02.771Z",
                    "_id": "6063e7c91bfc89fd1960ae5b",
                    "name": "clin_pheno",
                    "label": "Clinical Phenotype",
                    "collectionID": "5f74a0e05443973d2bfd870c",
                    "lastUpdatedUser": "5f39add38db6c9a200168a22",
                    "owner": "5f39add38db6c9a200168a22",
                    "perms": {
                        "read": {
                            "group": [
                                "5fb4575faa5adff6f407f2d1"
                            ]
                        },
                        "write": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        }
                    },
                    "ontology": {
                        "create": true,
                        "include": [
                            "Dermatomyositis",
                            "GVHD",
                            "Healthy Control",
                            "Lupus",
                            "Psoriasis",
                            "Vitiligo"
                            ]
                    }
                }
            }
        }

Delete a Field 
~~~~~~~~~~~~~~

.. http:delete:: /api/v1/fields/(string:field_id)

    Deleting an existing field.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X DELETE \
          -H "Authorization: Bearer <your-access-token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/fields/6063e7c91bfc89fd1960ae5b 
 
    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "doc": "Deleted!"
            }
        }
        
Data
----

Get All Data of the Collection in a Project 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. http:get:: {{URL}}/api/v1/projects/(string:project_name)/data/(string:collection_name)

    Retrieve all data of the collection in a project for the current logged in user.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET 'https://dmeta-skin.dolphinnext.com/api/v1/projects/vitiligo/data/sample' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "results": 2,
            "data": {
                "data": [
                    {
                        "creationDate": "2020-12-17T16:42:06.252Z",
                        "lastUpdateDate": "2020-12-17T16:42:06.252Z",
                        "_id": "5fdb8c6ad6330eb80d503fe2",
                        "name": "CL067_L2_V1_Bst_sc_iD",
                        "sample_type": "scRNAseq",
                        "technology": "inDrop",
                        "status": "Processed",
                        "contract": "scRNAseq",
                        "bead_occup": "65-70%",
                        "biosamp_id": "5fdb8820d6330eb80d503a31",
                        "lastUpdatedUser": "5f92529b89c7d0b3bf31ac27",
                        "owner": "5f92529b89c7d0b3bf31ac27",
                        "perms": {
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            },
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            }
                        },
                        "DID": 1
                    },
                    {
                        "creationDate": "2020-12-17T16:42:06.252Z",
                        "lastUpdateDate": "2020-12-17T16:42:06.252Z",
                        "_id": "5fdb8c6ad6330eb80d503fe4",
                        "name": "VB071_L1_V1_Bst_sc_iD",
                        "sample_type": "scRNAseq",
                        "technology": "inDrop",
                        "status": "Processed",
                        "contract": "scRNAseq",
                        "bead_occup": "33/50 (~65%)",
                        "biosamp_id": "5fdb8820d6330eb80d503a33",
                        "lastUpdatedUser": "5f92529b89c7d0b3bf31ac27",
                        "owner": "5f92529b89c7d0b3bf31ac27",
                        "perms": {
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            },
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            }
                        },
                        "DID": 2
                    }]
                }
            }

 



Get a Data 
~~~~~~~~~~~

.. http:get:: {{URL}}/api/v1/projects/(string:project_name)/data/(string:collection_name)/(string:data_id)


    Retrieve details of a single data.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X GET \
        'https://dmeta-skin.dolphinnext.com/api/v1/projects/vitiligo/data/sample/5fdb8c6ad6330eb80d503fe2' \
        -H 'Authorization: Bearer <your-access-token>'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": [
                            {
                        "creationDate": "2020-12-17T16:42:06.252Z",
                        "lastUpdateDate": "2020-12-17T16:42:06.252Z",
                        "_id": "5fdb8c6ad6330eb80d503fe2",
                        "name": "CL067_L2_V1_Bst_sc_iD",
                        "sample_type": "scRNAseq",
                        "technology": "inDrop",
                        "status": "Processed",
                        "contract": "scRNAseq",
                        "bead_occup": "65-70%",
                        "biosamp_id": "5fdb8820d6330eb80d503a31",
                        "lastUpdatedUser": "5f92529b89c7d0b3bf31ac27",
                        "owner": "5f92529b89c7d0b3bf31ac27",
                        "perms": {
                            "write": {
                                "group": [
                                    "5fb45793aa5adff6f407f2d2"
                                ]
                            },
                            "read": {
                                "group": [
                                    "5fb4575faa5adff6f407f2d1"
                                ]
                            }
                        },
                        "DID": 1
                    }
                ]
            }
        }


Create a Data 
~~~~~~~~~~~~~

.. http:post:: {{URL}}/api/v1/projects/(string:project_name)/data/(string:collection_name)

    This post request is only allowed for the users that have the write permission.

    **Example request**:

    .. sourcecode:: bash

        $ curl -X POST \
        'https://dmeta-skin.dolphinnext.com/api/v1/projects/vitiligo/data/sample' \
        -H 'Authorization: Bearer <your-access-token>' \
        -H 'Content-Type: application/json' \
        -d '
            {
                "name": "CL070_L2_V1_Bst_sc_iD",
                "sample_type": "scRNAseq",
                "technology": "inDrop",
                "status": "Sequenced",
                "contract": "scRNAseq",
                "bead_occup": "65-70%",
                "biosamp_id":"5fdb8820d6330eb80d503a31"
            }'

    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": {
                    "creationDate": "2021-03-31T03:16:58.503Z",
                    "lastUpdateDate": "2021-03-31T03:16:58.503Z",
                    "_id": "606453c0cb44bcfdbb84c6a2",
                    "name": "CL070_L2_V1_Bst_sc_iD",
                    "sample_type": "scRNAseq",
                    "technology": "inDrop",
                    "status": "Sequenced",
                    "contract": "scRNAseq",
                    "bead_occup": "65-70%",
                    "biosamp_id": "5fdb8820d6330eb80d503a31",
                    "lastUpdatedUser": "5f39add38db6c9a200168a22",
                    "owner": "5f39add38db6c9a200168a22",
                    "perms": {
                        "read": {
                            "group": [
                                "5fb4575faa5adff6f407f2d1"
                            ]
                        },
                        "write": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        }
                    },
                    "DID": 135
                }
            }
        }


Update a Data
~~~~~~~~~~~~~

.. http:patch:: {{URL}}/api/v1/projects/(string:project_name)/data/(string:collection_name)/(string:data_id)


    Update an existing field.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X PATCH \
          -H "Authorization: Bearer <your-access-token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/projects/vitiligo/data/sample/606453c0cb44bcfdbb84c6a2 \
          -H "Content-Type: application/json" \
          -d '
              {
                "status":"Processed"
              }'
    
    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "data": {
                    "creationDate": "2021-03-31T03:16:58.503Z",
                    "lastUpdateDate": "2021-03-31T03:16:58.503Z",
                    "_id": "606453c0cb44bcfdbb84c6a2",
                    "name": "CL070_L2_V1_Bst_sc_iD",
                    "sample_type": "scRNAseq",
                    "technology": "inDrop",
                    "status": "Processed",
                    "contract": "scRNAseq",
                    "bead_occup": "65-70%",
                    "biosamp_id": "5fdb8820d6330eb80d503a31",
                    "lastUpdatedUser": "5f39add38db6c9a200168a22",
                    "owner": "5f39add38db6c9a200168a22",
                    "perms": {
                        "read": {
                            "group": [
                                "5fb4575faa5adff6f407f2d1"
                            ]
                        },
                        "write": {
                            "group": [
                                "5fb45793aa5adff6f407f2d2"
                            ]
                        }
                    },
                    "DID": 135
                }
            }
        }

Delete a Data 
~~~~~~~~~~~~~~

.. http:delete:: {{URL}}/api/v1/projects/(string:project_name)/data/(string:collection_name)/(string:data_id)

    Deleting an existing data.

    **Example request**:

    .. sourcecode:: bash

        $ curl \
          -X DELETE \
          -H "Authorization: Bearer <your-access-token>" \
          https://dmeta-skin.dolphinnext.com/api/v1/projects/vitiligo/data/sample/606453c0cb44bcfdbb84c6a2 
 
    **Example response**:

    .. sourcecode:: json

        {
            "status": "success",
            "data": {
                "doc": "Deleted!"
            }
        }