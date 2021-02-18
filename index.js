const express = require("express")
const app = express()
const fs = require("fs")
const body_parser = require("body-parser")
const firebase_functions = require("firebase_CRUD_custom_code/firebase_functions")
objForUrlencoded = body_parser.urlencoded({extended:false})


app.set("view engine", "ejs")
app.use("/assets", express.static("assets"))
app.use(objForUrlencoded)

app.get("/", (req,res,next)=>{
	res.render("homepage")
})
app.get("/save_data.ejs", (req,res,next)=>{
	res.render("save_data")
})
app.get("/search_data.ejs", (req,res,next)=>{
	res.render("search_data")
})
app.post("/successpage", objForUrlencoded, (req,res)=>{
	console.log(firebase_functions)
	firebase_functions.firebase_save_data(req.body, res)
	//res.render("successpage")
})
app.post("/search_data.ejs", (req, res, next)=>{
	category = req.body["cat"]
	firebase_functions.firebase_retrieve_data(category)
})
app.listen(1337, ()=>{ console.log("Listening on port 1337")})