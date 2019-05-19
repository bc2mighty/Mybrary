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

router.post("/",upload.single("coverImageName") ,async(req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description,
        coverImageName: fileName
    });

    try{
        // const newBook = await book.save((err, book) => {
            //Remember to use err for getting validation errors
            // if (err) return res.json(err);
        // });

        const newBook = await book.save({});
        // res.redirect("books/${newBook.id}");
        res.redirect("books");
    }catch{
        if(book.coverImageName != null){
            removeBookCover(book.coverImageName);
        }

        renderNewPage(res, new Book(), true);
    }
});

function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath, fileName), err => {
        if(err) console.log(err);
    });
}

async function renderNewPage(res, book, hasError = false){
    try{
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book
        };
        if(hasError) params.errorMessage = "Error Creating Book";
        res.render("books/new",params);
    }catch{
        res.redirect("books");
    }
}

module.exports = router;
