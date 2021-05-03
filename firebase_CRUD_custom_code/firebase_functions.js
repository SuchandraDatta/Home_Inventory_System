/*Set up Admin API for Firebase*/
const admin = require('firebase-admin');
//Define path to secret key generated for service account
const serviceAccount = require("config/PATH TO FILE");
//Initialize the app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

define_timestamp = () => {
	//getMonth returns 0 = January, 1=February and so on
	d = new Date()
	return (d.getDate()+"-"+(d.getMonth()+1)+"-"+d.getFullYear()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+":"+d.getMilliseconds())
}

firebase_save_data = async (reqbody, response) => {
	/*Scheme of data from form
	{ 
		"productName1":...,
		"productCategory1":...,
		"price1":...,
		"quantity1":...,
		"expiryDate1":...,
		...
		"productNameN":...,
		"productCategoryN":...,
		"priceN":...,
		"quantityN":...,
		"expiryDateN":...,		
	}
	We convert this to 
	{
		"category":{
			"productName_timestamp" : {
				"Price":...,
				"Quantity":...,
				"ExpiryDate":...
			}
		}
	}

	*/
	save_to_database = {}
	//console.log(reqbody)
	//Construct a new JS object with required schema. Divide with # of fields in form input, here 5 as there are 5 inputs --> category, product name, price, quantity, expiry date.
	N = (Object.keys(reqbody).length-1)/5
	//console.log("Number of items: "+N)
	for(let i=1;i<=N;i++)
	{
		if(reqbody["productCategory"+i] in save_to_database)
		{
			//console.log(reqbody["productCategory"+i] + " the category already exists")
			save_to_database[[reqbody["productCategory"+i]]][[reqbody["productName"+i] +"_"+define_timestamp()]]=
			{
				"Price":parseFloat(reqbody["price"+i]),
				"Quantity":parseFloat(reqbody["quantity"+i]),
				"ExpiryDate":reqbody["expiryDate"+i]
			}
		}
		else
		{
			save_to_database[ [reqbody["productCategory"+i]] ]=
			{
				[[reqbody["productName"+i] +"_"+define_timestamp()]]:
				{
					"Price":parseFloat(reqbody["price"+i]),
					"Quantity":parseFloat(reqbody["quantity"+i]),
					"ExpiryDate":reqbody["expiryDate"+i]
				}
			}
			//console.log("Creating first time", save_to_database)
		}
	}
	//console.log(save_to_database)
	//let db = admin.database()
	let db = admin.firestore()
	try
	{
		for(key in save_to_database)
		{
			for(prod in save_to_database[key])
				{
					await db.collection(key).doc(prod).set(save_to_database[key][prod])
				}
		}
		/*if(db.ref("/").orderByChild(key).limitToFirst(1)!={})
		{
			ref.update(save_to_database[key], (err)=>{ if(err) response.render("failurepage"); else response.render("successpage")})
		}
		else
		{
			ref.set(save_to_database[key], (err)=>{ if(err) response.render("failurepage"); else response.render("successpage")})
		}*/
		response.render("successpage")
	}
	catch(error)
	{
		response.render("failurepage")
	}
}

helper_func_iterate_docs = (ordered_data, response, category, aggregate_output_string) => {
	if(ordered_data.empty)
		{
			response.render("search_data_output", {Product_Info:{}, aggregate_output: aggregate_output_string, category: category})
		}
	else
		{
			Product_Info = {}
			ordered_data.forEach((doc) => { Product_Info[doc.id] = doc.data()})
			console.log("OUTPUT: ", Product_Info)
			response.render("search_data_output", { Product_Info: Product_Info, aggregate_output: "", category: category})
		}
}
helper_func_get_data = async (category, db) => {
	const data = await db.collection(category).get()
	if(data.empty)
		{
			return -1
		}
	else return data

}
firebase_retrieve_data = async (category="",response,filter_criteria="Nothing", aggregate_over="Nothing", prodName="", exprInMonths) => {
	//Search according to 3 categories
	let db = admin.firestore()
	Product_Info = {}
	//When you do orderBy some field, you'll most likely get a lot of documents. When you have to work with more than 1 document, ALWAYS you'll get a Snapshot with which to work. When you have 1 document, you can use ordered_data.exists and for lots of docs, iterate over them. Also, forEach is synchronous; callbacks DO NOT MEAN they'll be asynchronous like map() isn't asynchronous.
	if(Number.isNaN(exprInMonths)==false && category!="")
	{
		//Dates saved in ISO format YYYY-MM-DD in database so that dates can just be sorted lexicographically without any hassles. Display all products expiring in exprInMonths.
		today = new Date()
		lastDate = new Date(today.getFullYear(), (today.getMonth()+exprInMonths), today.getDate()).toISOString().split("T")[0]
		console.log("Last date: ", lastDate)
		const data = await db.collection(category).where("ExpiryDate", "<=", lastDate).get()
		helper_func_iterate_docs(data, response, category, "No products expiring in "+exprInMonths+" month(s)")
	}
	else if(prodName!="" && category!="")
	{
		//Display by product name
		const data = await helper_func_get_data(category, db)
		if(data==-1){ response.render("failurepage")}
		else
		{
			Product_Info = {}
			data.forEach((doc) => { temp = doc.id.split(" ")[0]; temp = temp.substr(0, temp.lastIndexOf("_")); if(temp == prodName) Product_Info[doc.id] = doc.data()})
			if(Product_Info!={})
			response.render("search_data_output", {Product_Info: Product_Info, category: category, aggregate_output:""})
			else
			response.render("search_data_output", {Product_Info: Product_Info, category: category, aggregate_output:"No products found with that name"})
		}

	}
	else if(aggregate_over!="Nothing" && category!="Nothing")
	{
		//Display on basis of aggregate over price or quantity
		const data = await helper_func_get_data(category, db)
		if(data == -1) { response.render("failurepage")}
		else
		{
			total_agg = 0
			data.forEach((doc) => { total_agg+=doc.data()[aggregate_over]})
			console.log("Total ", aggregate_over, " is ", total_agg)
			response.render("search_data_output", {Product_Info:{}, category:category, aggregate_output: "Total "+aggregate_over+ " of "+category+" is "+total_agg + "(g/Rs/l)"})
		}
	}
	else if(filter_criteria != "Nothing" && category!= "")
	{ 
		//Sorted by price, quantity, expiry date
		console.log("Filtering over", filter_criteria)
		const ordered_data = await db.collection(category).orderBy(filter_criteria).get() 
		helper_func_iterate_docs(ordered_data, response, category, "No data for filter by"+filter_criteria)
	}
	else if(category!="")
	{
		//Nothing specified, show by category
		const ordered_data = await db.collection(category).get()
		helper_func_iterate_docs(ordered_data, response, category, "No data forg given category")
	}
	else
		response.render("failurepage")
}
firebase_delete_data = async (category, response, product_name) => {
	try
	{ console.log(category)
	  console.log(product_name)
	  let db = admin.firestore()
	  await db.collection(category).doc(product_name).delete()
	  response.render("search_data")
	   }
	catch(err)
	{console.log(err)}
}
firebase_update_data = async (category, response, reqbody) => {
	try
	{
		let db = admin.firestore()
		await db.collection(category).doc(reqbody["productName"]).update({"Price": parseFloat(reqbody["price"]), "Quantity": parseFloat(reqbody["quantity"]), "ExpiryDate": reqbody["expiryDate"]})
		response.render("successpage")
	}
	catch(err)
	{
		console.log(err)
		response.render("failurepage")
	}
}
module.exports = {
	"firebase_save_data" : firebase_save_data,
	"firebase_retrieve_data": firebase_retrieve_data,
	"firebase_delete_data": firebase_delete_data,
	"firebase_update_data": firebase_update_data
	}