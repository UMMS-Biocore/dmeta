**********
Data Guide
**********

In this section, we will investigate the data tables and how you can insert, update and delete data in the collections.

Basics
======
At the top of the page, you will notice the **All Events** and **All Collections** tabs. You can insert/update/delete data from collections using **All Collections** tab, whereas the **All Events** tab is used for inserting new or updating existing data in a simplified and structured way.


All Events
==========
All Events are listed in the initial dropdown. Please see the example below:

.. image:: images/allevents.png
    :align: center
    :width: 99%

Here you can simply select the action you want to perform. As an example, **Update Patient Visit** is selected and form fields are loaded as below:

.. image:: images/events_patient_visit.png
    :align: center
    :width: 99%

You can either choose or type patient name to select patient from dropdown:

.. image:: images/events_select_patient.png
    :align: center
    :width: 99%

After choosing a patient, the patient visit dropdown will be filtered and only shows the visits that belong to the selected patient. Now you can simply select the patient visit to update:

.. image:: images/events_select_patient_visit.png
    :align: center
    :width: 99%

As soon as a patient visit is selected, form fields are loaded with selected visit data. After making changes, you can click the save button to submit changes.

.. image:: images/events_update_patient_visit.png
    :align: center
    :width: 99%

All Collections
===============

All Collections are listed in the initial dropdown. Here you can simply select the collection you want to view. As an example, **Biosamples** collection is selected as below:

.. image:: images/allcollections_biosamples.png
    :align: center
    :width: 99%

At the top of the table, action buttons are located. Please see their details at below:

.. image:: images/allcollections_buttons.png
    :align: center
    :width: 50%
    
Insert
------

You can insert data into the collection by using the insert button. It will open the form window for data submission. Please check the example below. 

.. image:: images/allcollections_biosamples_insert.png
    :align: center
    :width: 90%

Edit
----

After clicking one of the checkboxes, you can start editing by clicking the edit button. A similar form window will open for editing. If you choose multiple items at the same time, it will allow you to update certain fields of the selected data and keep the rest as it is. Please check the example below:

Single Data Edit
~~~~~~~~~~~~~~~~

.. image:: images/allcollections_biosamples_edit_one.png
    :align: center
    :width: 99%

Multiple Data Edit
~~~~~~~~~~~~~~~~~~

.. image:: images/allcollections_biosamples_edit_multiple.png
    :align: center
    :width: 99%
    
Delete
------

In order to remove data from collections, you can select one or multiple items with checkboxes and click the delete button.

Edit in Spreadsheet
-------------------

Another way to edit multiple items is using spreadsheet view. After clicking the **Edit in Spreadsheet** button, the spreadsheet format will be visualized. 


Table View:

.. image:: images/allcollections_visit_spreadsheet0.png
    :align: center
    :width: 70%

Spreadsheet View:

.. image:: images/allcollections_visit_spreadsheet1.png
    :align: center
    :width: 99%

Now, you can copy and paste into multiple fields as in the Excel file. As an example, the **1st visit** value is filled into four cells by copy and paste below. Updated cells are highlighted.

.. image:: images/allcollections_visit_spreadsheet2.png
    :align: center
    :width: 99%

After clicking **Save Changes** button at the top, highlighted cells are synchronized with database and status of update is shown as below:

.. image:: images/allcollections_visit_spreadsheet3.png
    :align: center
    :width: 99%

Table view:

.. image:: images/allcollections_visit_spreadsheet4.png
    :align: center
    :width: 71%



Download as Excel File
----------------------

You can download all collection data by clicking the **Download as Excel File** button. 

.. image:: images/allcollections_visit_excel_download.png
    :align: center
    :width: 71%


Import Excel File
-----------------

After you edit your data in Excel, you can import changes by clicking the **Import Excel File** button. 

.. image:: images/allcollections_visit_excel_import.png
    :align: center
    :width: 99%
