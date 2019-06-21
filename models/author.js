const mongoose = require("mongoose");
const Book = require("./book");

const authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

authorSchema.pre("remove",function(next){
    Book.find({author: this.id}, (err, books) => {
        if(err){
            next(err);
        }else if(books.length > 0){
            console.log("Author has some books here, you can not delete him yet!")
            next( new Error("Author has some books"));
        }else{
            next();
        }
    });
});
module.exports = mongoose.model("Author", authorSchema);