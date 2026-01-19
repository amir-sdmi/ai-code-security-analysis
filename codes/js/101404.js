const express = require('express');
const app = express();
const port = 3000;

app.use(express.json())

// generated with ChatGPT
let books = [
  { isbn: "978-0143124177", title: "The Goldfinch", year: "2013", author: "Donna Tartt" },
  { isbn: "978-0307277671", title: "The Road", year: "2006", author: "Cormac McCarthy" },
  { isbn: "978-0553386790", title: "The Book Thief", year: "2005", author: "Markus Zusak" },
  { isbn: "978-0812995343", title: "All the Light We Cannot See", year: "2014", author: "Anthony Doerr" },
  { isbn: "978-0375831003", title: "The Curious Incident of the Dog in the Night-Time", year: "2003", author: "Mark Haddon" },
  { isbn: "978-1501132957", title: "The Underground Railroad", year: "2016", author: "Colson Whitehead" },
  { isbn: "978-0679735779", title: "Beloved", year: "1987", author: "Toni Morrison" },
  { isbn: "978-0316769488", title: "The Catcher in the Rye", year: "1951", author: "J.D. Salinger" },
  { isbn: "978-0143039433", title: "Never Let Me Go", year: "2005", author: "Kazuo Ishiguro" },
  { isbn: "978-0345804310", title: "Gone Girl", year: "2012", author: "Gillian Flynn" }
];

let lends = [
    { lendID: 1, isbn: "9780316055444", BuchID: "1a", customerID: "101", borrowed_at: "21.02.2023", returnedAt: "02.03.2023" }, 
    { lendID: 2, isbn: "9780307387899", BuchID: "2b", customerID: "102", borrowed_at: "26.03.2023", returnedAt: "02.03.2023" }, 
    { lendID: 3, isbn: "9780061120084", BuchID: "3c", customerID: "103", borrowed_at: "15.04.2023", returnedAt: "02.03.2023" }, 
    { lendID: 4, isbn: "9780451524935", BuchID: "4d", customerID: "104", borrowed_at: "02.05.2023", returnedAt: "02.03.2023" }, 
    { lendID: 5, isbn: "9780141439518", BuchID: "5e", customerID: "105", borrowed_at: "18.06.2023", returnedAt: "02.03.2023" }, 
    { lendID: 6, isbn: "9780140237504", BuchID: "6f", customerID: "106", borrowed_at: "30.07.2023", returnedAt: "02.03.2023" }, 
    { lendID: 7, isbn: "9780743273565", BuchID: "7g", customerID: "107", borrowed_at: "14.08.2023", returnedAt: "02.03.2023" }, 
    { lendID: 8, isbn: "9780061120091", BuchID: "8h", customerID: "108", borrowed_at: "05.09.2023", returnedAt: "02.03.2023" }, 
    { lendID: 9, isbn: "9780060850524", BuchID: "9i", customerID: "109", borrowed_at: "22.10.2023", returnedAt: "02.03.2023" }, 
    { lendID: 10, isbn: "9780547928227", BuchID: "10j", customerID: "110", borrowed_at: "11.11.2023", returnedAt: "02.03.2023" }, 
];



app.get('/books', (request, response) => {
    response.send(books);
});

app.get('/books/:isbn', (request, response) => {
    const isbn = request.params.isbn
    response.send(books.find((book) => book.isbn === isbn ))
});

app.post("/books", (request, response) => {

    if (!(req.body.id &&req.body.customer_id &&req.body.isbn &&req.body.borrowed_at)) {

        console.log(422);
        return res.status(422).send();
    }
    books.push(request.body)
    response.send(books)
});

app.put('/books/:isbn', (request, response) => {
    books = books.map((book) => (book.isbn === request.params ? request.body : book));
    response.json(books);
});

app.delete('/books/:isbn', (request, response) => {
    books = books.filter((book) => book.isbn !== request.params);
    response.send(Books)
  });

app.patch("books/:isbn", (request, response) => {
    const keys = Object.keys(request.params)
    const oldBook = books.find((book) => book.isbn === request.params )
    keys.forEach((key) => oldBook[key] = request.body[key])
    books = books.map((book) => (book.isbn === request.params ? oldBook : book));
    response.send(books)
})

app.get("/lends", (request, response) => {
   response.send(lends)
})

app.get("/lends/:id", (request, response) => {
    const lendID = request.params.id
    response.send(lends.find((lend) => lend.lendID == lendID ))
})

app.post('/lends', (request, response) => {


    lends = [...lends, request.body];
    lends.push(request.body);
    console.log("Status: 422")
    response.status(201).send(lends);

    if (!(req.body.id &&req.body.customer_id &&req.body.isbn &&req.body.borrowed_at)) {
        console.log("Status: 422");
        return res.status(422).send();
    }

  });

app.patch('/lends/:id', (req, res) => {


    const idLendtoUpdate = req.params.id;
    const lendToUpdate = lends.find((lend) => lend.id === idLendtoUpdate);

    if (req.body.returned_at !== undefined) {
        lendToUpdate.returned_at = req.body.returned_at;
        res.send(lends);
        console.log(lends);
    }

    if (!(req.body.id &&req.body.customer_id &&req.body.isbn &&req.body.borrowed_at)) {
        console.log("Status: 422");
        return res.status(422).send();
    }

});

app.get('/bookssss', (request, response) => {
    response.send(books);
});


app.listen(port, () => {
  console.log(`Bookstore app listening on port ${port}`);
});