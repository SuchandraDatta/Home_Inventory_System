const express = require("express")
const app = express()
const fs = require("fs")
const body_parser = require("body-parser")
const firebase_functions = require("firebase_CRUD_custom_code/firebase_functions")
objForUrlencoded = body_parser.urlencoded({extended:false})


app.set("view engine", "ejs")
app.use("/assets", express.static("assets"))
app.use(objForUrlencoded)

app.get("/", (req,res,next)=>{//Show the homepage
	res.render("homepage")
})
app.get("/save_data.ejs", (req,res,next)=>{//Show the form for saving data
	res.render("save_data")
})
app.get("/search_data.ejs", (req,res,next)=>{//Show the form for searching data
	res.render("search_data")
})
app.get("/delete", (req,res) => {//Delete data and show the form for searching data
	console.log("ID TO DELETE: ", req.query.id)
	firebase_functions.firebase_delete_data(req.query.category, res, req.query.id)
})
app.post("/successpage", objForUrlencoded, (req,res)=>{
	//Success page after data is saved in the database
	console.log(firebase_functions)
	firebase_functions.firebase_save_data(req.body, res)
})
app.post("/search_data_output.ejs", (req, res, next)=>{
	//Perform search/sort/filtering/aggregation
	category = req.body["cat"]
	filter_criteria = req.body["filter"]
	aggregate_over = req.body["aggregate_over"]
	prodName = req.body["prodName"]
	exprInMonths = parseInt(req.body["exprInMonths"])
	firebase_functions.firebase_retrieve_data(category,res,filter_criteria, aggregate_over, prodName, exprInMonths)
})
app.post("/update", objForUrlencoded, (req,res) => {
	//Update the data and show the form for search data
	console.log(req.body)
	firebase_functions.firebase_update_data(req.body["category"], res, req.body)
})
app.listen(1337, ()=>{ console.log("Listening on port 1337")})