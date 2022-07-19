
//Require the necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _=require("lodash");
mongoose.connect("mongodb://localhost:27017/todolistDB");

//Create a schema for the todo list
const itemSchema= new mongoose.Schema({
  name: String
})
//Create a model for the todo list
const Item = mongoose.model("Item", itemSchema);

//Create new items in the todo list
const item1= new Item({name:"Welcome to your todo list!"});
const item2= new Item({name:"Hit the + button to add a new item."});
const item3= new Item({name:"<-- Hit this to delete an item"});

const defaultItems=[item1,item2,item3];
const listSchema=mongoose.Schema({
  name: String,
  items: [itemSchema]
})

const List =mongoose.model("List",listSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function(req, res) {
  const day = date.getDate();
  //Find all the items in the todo list
  
  Item.find({},function (err, foundItems) {
    if(foundItems.length === 0)
    {
//Inserting default items
      Item.insertMany(defaultItems,function(err)
      {
        if(err){
          console.log(err)
        }
        else{
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    }
    else{
       res.render("list", { listTitle: day, newListItems: foundItems }); 
    }
 
    if (err) {
      console.log(err);
    } else {
      
     
    }
  });

  
});
app.get("/:customlistName", function (req, res) {
  const customListName = _.capitalize(req.params.customlistName);
  

  List.findOne({name:customListName},function(err,list){
    if(!err)
    {
      if(!list){
        //Create a new list
            const list= new List({
              name: customListName,
              items: defaultItems
            });
            list.save();
            res.redirect("/"+customListName);
      }
      else{
        res.render("list", {
          listTitle: list.name,
          newListItems: list.items,
        });
      }
    }
  })
  
}); 

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({name: itemName});

  if(listName===date.getDate()){
      item.save();
      res.redirect("/");
  }
  else{
    List.findOne({name:listName   },function(err,foundlist){
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/"+listName);
    })
  }



});
app.post("/delete",function(req,res){
  
  const checkedItemId = req.body.checkbox;
  const listName=req.body.listname;

  if(listName===date.getDate()){
  Item.findByIdAndRemove(checkedItemId, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Succesfully removed !");
    }
  });
  res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundlist)
    {
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }


})


 

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port||3000, function() {
  console.log("Server started on port 3000");
});
