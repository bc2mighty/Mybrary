const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Book = require("../models/book");
const fs = require("fs");
const Author = require("../models/author");
const uploadPath = path.join('public', Book.coverImageBasePath);
const imageMimeTypes = ["image/jpeg","image/png","image/gif"];

const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype));
    }
});

router.get("/", async(req, res) => {
    let query = Book.find();
    
    if(req.query.title != null && req.query.title != ""){
        query = query.regex("title", new RegExp(req.query.title, "i"));
    }

    if(req.query.publishBefore != null && req.query.publishBefore != ""){
        query = query.lte('publishDate', req.query.publishBefore);
    }

    if(req.query.publishAfter != null && req.query.publishAfter != ""){
        query = query.gte('publishDate', req.query.publishAfter);
    }

    try{
        const books = await query.exec();
        res.render("books/index", {
            books: books,
            searchOptions: req.query
        });
    }catch{
        res.redirect("books");
    }
});

router.get("/new", async(req, res) => {
    renderNewPage(res, new Book());
});

router.get("/:id", async(req, res) => {
    try{
        const book = await Book.findById(req.params.id).populate('author').exec();
        // return res.json(book);
        res.render("books/show", {book: book});
    }catch{
        res.redirect("/");
    }
});

router.get("/:id/edit", async(req, res) => {
    try{
        const book = await Book.findById(req.params.id);
        renderEditPage(res, book, );
    }catch{
        res.redirect("/");
    }
});

router.post("/", upload.single('coverImageName'), async(req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description,
        coverImageName: fileName
    });

    // saveBook(book, req.body.coverImageName);

    try{
        // const newBook = await book.save((err, book) => {
        //     // Remember to use err for getting validation errors
        //     if (err) return res.json(err);
        // });

        const newBook = await book.save({});
        res.redirect(`books/${newBook.id}`);
    }catch{
        if(book.coverImageName != null){
            removeBookCover(book.coverImageName);
        }

        renderNewPage(res, new Book(), true);
    }
});

//Update Route
router.put("/:id", upload.single('coverImageName'), async(req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    // console.log(fileName);
    // res.end();
    let book;
    try{
        book = await Book.findById(req.params.id);
        book.title = req.body.title;
        book.author = req.body.author;
        book.publishDate = new Date(req.body.publishDate);
        book.pageCount = req.body.pageCount;
        book.description = req.body.description;
        book.coverImageName = fileName;

        // res.json(book);
        await book.save();
        res.redirect(`/books/${book.id}`);
    }catch(err){
        console.log(err);

        if(book != null){
            renderEditPage(res, book, true);
        }else{
            res.redirect("/");
        }
    }
});

router.delete("/:id", async(req,res) => {
    let book
    try{
        book = await Book.findById(req.params.id)
        await book.remove()
        res.redirect('/books')
    }catch{
        if(book == null){
            res.redirect('/')
        }else{
            res.render('show',{
                book: book,
                errorMessage: "Could not remove books"
            })
        }
    }
})

//Render edit page
async function renderEditPage(res, book, hasError = false){
    renderFormPage(res, book, "edit", hasError);
}

//Render a new form function
async function renderFormPage(res, book, form, hasError = false){
    try{
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book
        };
        if(hasError){
            if(form == "edit"){
                params.errorMessage = "Error Updating Book";
            }else{
                params.errorMessage = "Error Creating Book";
            }
        }
        res.render(`books/${form}`, params);
    }catch{
        res.redirect("/books");
    }
}

function saveBook(book, coverEncoded){
    if(coverEncoded == null) return;
    const cover = JSON.parse(coverEncoded);
    if(cover != null && imageMimeTypes.includes(cover.type)){
        book.coverImage = Buffer.from(cover.data, "base64");
        book.coverImageType = cover.type;
    }
}

function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath, fileName), err => {
        if(err) console.log(err);
    });
}

//Render create Page
async function renderNewPage(res, book, hasError = false){
    renderFormPage(res, book, "new", hasError)
}

module.exports = router;
