Steps to start this app:
*  cd loan-calulator
*  npm install
*  node index.js (to start run stand alone mode) or node services.js (to start web server)


1. How long did you spend working on the problem? What did you find to be the most difficult part?
Spent almost 2 to 2.5 hrs coding the solution. The difficult part was to understand the problem and understand how loans have to be assigned. This alone took around an additional 30 to 45 minutes.

2. How would you modify your data model or code to account for an eventual introduction of new, as­of­yet unknown types of covenants, beyond just maximum default likelihood and state restrictions?
The entire banking model is represented as a JSON. So introducing a new covenant would require adding this attribute to the JSON under the bank or under the facility.

3. How would you architect your solution as a production service wherein new facilities can be introduced at arbitrary points in time. Assume these facilities become available by the finance team emailing your team and describing the addition with a new set of CSVs.
Created a new REST service for adding new facilities to the overall bank-facilities JSON.
POST - http://localhost:8000/facility/add - Please refer services.js
This will add the new facility to the bankFacilitiesMap cache.

4. Your solution most likely simulates the streaming process by directly calling a method in your code to process the loans inside of a for loop. What would a REST API look like for this same service? Stakeholders using the API will need, at a minimum, to be able to request a loan be assigned to a facility, and read the funding status of a loan, as well as query the capacities remaining in facilities.
PUT - http://localhost:8000/loan/assign - Please refer services.js and index.js. Code is already refactored to add loan to facility.
GET - http://localhost:8000/facility - Returns info about facility. Including information about yield for each facility and amount left.
