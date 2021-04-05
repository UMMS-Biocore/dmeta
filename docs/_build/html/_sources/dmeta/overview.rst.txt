**************
Short Overview
**************

What is Dmeta?
====================

Dmeta is a standalone metadata tracking system that also integrates automated data processing pipelines and data analysis and visualization modules to support a wide variety of use cases from basic to complex, multi-organization/lab-based projects. It seamlessly communicates with data processing servers (e.g. `DolphinNext <https://dolphinnext.umassmed.edu/>`_) and analysis and visualization servers (e.g. Dportal)


Benefits of the design
----------------------

* **Flexible Design:** Define project collection and fields flexibly with a software architecture developed by MongoDB data management system. MongoDB allows a flexible data field schema where users can efficiently update data fields of any entry or information of the associated metadata. 

* **WEB APIs:** Dmeta also incorporates extensive and secure token-based WEB APIs to make the metadata and processed data available to its users in FAIR standards.

* **Integration with 3rd parties:** Dmeta is fully integrated with data browsing and preprocessing platforms Dportal and Dnext, but in addition to these platforms, other pipeline management and data portal systems can be integrated for data preprocessing and analysis.

* **Event-based Management:** Events are specific types of insert, delete and edit operations that are defined by the project administrators to allow internal users to manage multiple permitted fields and collection in an organized manner.

* **Validation with Ontology Servers:** Data fields linked to ontology servers or user admin specified dictionaries which allows collecting the information in a standardized way from each user.

* **Share:** Each project, collection, field, and document in Dmeta have its permission description which allows you to limit the access, update or submit operations to specified groups or users.


Who is Dmeta for?
=======================

Dmeta is designed for a wide variety of users, from bench biologists to expert bioinformaticians. 

* **Data submission** requires no programming knowledge and we aim to create an event-based approach to simplify this process. 

* **Metadata setup** requires basic database knowledge, and familiarization with MongoDB to effectively use its operators. You don't need to learn all of the MongoDB syntaxes, instead, you can easily focus on the field settings. The rest is handled by Dmeta (e.g. creating parent-child relationships with collections, delivering data from ontology servers, etc.)
    

Dmeta Projects
================

Here is the shortlist of existing projects where Dmeta and Dportal are used:

* Skin Project: https://dmeta-skin.dolphinnext.com/ and https://dportal-skin.dolphinnext.com/
    
    

