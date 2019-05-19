# dbpouch

Fastest and easiest database in cloud, based on PouchDb & node-pouch. Work with multiple cloud databases like a PRO.  
Uses node-pouch module to get/save data from/to dbpouch.com servers.

To generate access code and get API key, please read instructions on the website: [https://dbpouch.com/](https://dbpouch.com/)

### **Usage:**
```
var dbpouch = require("dbpouch");
var dbpouch = new exports({
  link: "https://n1.dbpouch.com",
  apiKey: "<your_api_key_here>",
  database: "test"
});
dbpouch.save({name: "Apple", type: "fruit"}).then(function(data) {
  console.log(data);
}).catch(function(error) {
  console.log(error);
});
```

------------------------

### **Methods:**

`.save(data, database);`

- `data`: Should be an object. Record ID should be specified as `_id`.  
Example: `.save({_id: "apple", name: "Apple", type: "fruit"});`.  
Set `_deleted: true` if you want to delete the record.

- `database`: Optional if already provided when creating a new instance of the module. Useful if you want to use a different database name.

`.get(id, database);`

- `data`: Fetch a record using its `id`.
Example: `.get("apple");`.
- `database`: Optional if already provided when creating a new instance of the module. Useful if you want to use a different database name.

`.record(query, database);`

- `query`: Search and get the record.
Examples: `.record({_id: "apple"});`, `.record({name: "Apple"});`, `.record({name: "Apple", type: "fruit"});`.
Gets only single record if multiple records match the query.
- `database`: Optional if already provided when creating a new instance of the module. Useful if you want to use a different database name.

`.records(query, database);`

- `query`: Search and get the records.
Examples: `.records({_id: "apple"});`, `.records({name: "Apple"});`, `.records({type: "fruit"});`.
- `database`: Optional if already provided when creating a new instance of the module. Useful if you want to use a different database name.

---------------------------------------------

See [https://dbpouch.com/](https://dbpouch.com/) for more information.  
Copyright &copy; [DbPouch](https://dbpouch.com/)