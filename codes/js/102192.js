/*
    Script to insert books into database
*/
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Book, Author, Genre, Publisher } from './models/Book.js';

dotenv.config()

const insertBooks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // Clear existing data to prevent conflicts
        await Promise.all([
            Book.deleteMany({}),
            Author.deleteMany({}),
            Genre.deleteMany({}),
            Publisher.deleteMany({})
        ]);

        // Random authors to populate AuthorSchema (Generated using ChatGPT)
        const [matt, kazuo, andy, kristin, v_e, brit, maggie, lucy, tara, yuval, james, alex] = await Author.insertMany([
            {
                name: 'Matt Haig',
                biography: 'British author of novels and nonfiction.',
                birthDate: new Date('1975-07-03'),
                nationality: 'British'
            },
            {
                name: 'Kazuo Ishiguro',
                biography: 'British novelist and Nobel Prize winner.',
                birthDate: new Date('1954-11-08'),
                nationality: 'British'
            },
            {
                name: 'Andy Weir',
                biography: 'American novelist known for science fiction.',
                birthDate: new Date('1972-06-16'),
                nationality: 'American'
            },
            {
                name: 'Kristin Hannah',
                biography: 'American author of historical fiction.',
                birthDate: new Date('1960-09-25'),
                nationality: 'American'
            },
            {
                name: 'V.E. Schwab',
                biography: 'American author of fantasy novels.',
                birthDate: new Date('1987-07-07'),
                nationality: 'American'
            },
            {
                name: 'Brit Bennett',
                biography: 'American author known for literary fiction.',
                birthDate: new Date('1990-10-01'),
                nationality: 'American'
            },
            {
                name: 'Maggie O\'Farrell',
                biography: 'Irish-British author of contemporary fiction.',
                birthDate: new Date('1972-05-27'),
                nationality: 'British'
            },
            {
                name: 'Lucy Foley',
                biography: 'British author of mystery novels.',
                birthDate: new Date('1986-02-11'),
                nationality: 'British'
            },
            {
                name: 'Tara Westover',
                biography: 'American memoirist and historian.',
                birthDate: new Date('1986-09-27'),
                nationality: 'American'
            },
            {
                name: 'Yuval Noah Harari',
                biography: 'Israeli historian and author.',
                birthDate: new Date('1976-02-24'),
                nationality: 'American'
            },
            {
                name: 'James Clear',
                biography: 'American author and speaker.',
                birthDate: new Date('1986-01-01'),
                nationality: 'American'
            },
            {
                name: 'Alex Michaelides',
                biography: 'British-Cypriot author and screenwriter.',
                birthDate: new Date('1977-09-04'),
                nationality: 'British'
            }
        ])

        // Random genres to populate GenreSchema (Generated using ChatGPT)
        const [fiction, fantasy, sciencefiction, adventure, historicalfiction, drama, mystery, thriller, biography, memoir, nonfiction, history, science, selfhelp] = await Genre.insertMany([
            {
                name: 'Fiction',
                description: 'Literary works invented by the imagination.'
            },
            {
                name: 'Fantasy',
                description: 'Fantasy literature with mythical elements.'
            },
            {
                name: 'Science Fiction',
                description: 'Fiction based on imagined future scientific advances.'
            },
            {
                name: 'Adventure',
                description: 'Exciting or unusual experiences in fictional storytelling.'
            },
            {
                name: 'Historical Fiction',
                description: 'Fiction set in the past with historical context.'
            },
            {
                name: 'Drama',
                description: 'Serious narrative fiction focusing on emotional themes.'
            },
            {
                name: 'Mystery',
                description: 'Fiction dealing with solving a crime or uncovering secrets.'
            },
            {
                name: 'Thriller',
                description: 'Fiction that excites and keeps readers in suspense.'
            },
            {
                name: 'Biography',
                description: 'A detailed description of a person\'s life.'
            },
            {
                name: 'Memoir',
                description: 'A historical account or biography written from personal knowledge.'
            },
            {
                name: 'Non-Fiction',
                description: 'Factual literature based on real events and people.'
            },
            {
                name: 'History',
                description: 'Books dealing with historical facts and interpretation.'
            },
            {
                name: 'Science',
                description: 'Books covering scientific facts or topics.'
            },
            {
                name: 'Self-Help',
                description: 'Books aimed at personal development and improvement.'
            }
        ])

        // Random publishers to populate PublisherSchema (Generated using ChatGPT)
        const [canongate, faber, crown, st, tor, riverhead, tinder, harpercollins, random, vintage, avery, celadon] = await Publisher.insertMany([
            {
                name: 'Canongate Books',
                address: 'Edinburgh, UK',
                website: 'https://canongate.co.uk'
            },
            {
                name: 'Faber & Faber',
                address: 'London, UK',
                website: 'https://www.faber.co.uk'
            },
            {
                name: 'Crown Publishing',
                address: 'New York, USA',
                website: 'https://crownpublishing.com'
            },
            {
                name: 'St. Martin\'s Press',
                address: 'New York, USA',
                website: 'https://us.macmillan.com/stmartinspress'
            },
            {
                name: 'Tor Books',
                address: 'New York, USA',
                website: 'https://www.tor.com'
            },
            {
                name: 'Riverhead Books',
                address: 'New York, USA',
                website: 'https://www.penguin.com/publishers/riverheadbooks'
            },
            {
                name: 'Tinder Press',
                address: 'London, UK',
                website: 'https://www.tinderpress.co.uk'
            },
            {
                name: 'HarperCollins',
                address: 'New York, USA',
                website: 'https://www.harpercollins.com'
            },
            {
                name: 'Random House',
                address: 'New York, USA',
                website: 'https://www.randomhousebooks.com'
            },
            {
                name: 'Vintage Books',
                address: 'London, UK',
                website: 'https://www.vintage-books.co.uk'
            },
            {
                name: 'Avery',
                address: 'New York, USA',
                website: 'https://www.penguin.com/publishers/avery'
            },
            {
                name: 'Celadon Books',
                address: 'New York, USA',
                website: 'https://celadonbooks.com'
            }
        ])
        
        // Random books to populate BookSchema (Generated using ChatGPT)
        await Book.insertMany([
            {
                title: 'The Midnight Library',
                author: matt._id,
                publisher: random._id,
                isbn: '978-0-804734332',
                publishedDate: new Date('2080-01-01'),
                genres: [fiction._id, fantasy._id],
                description: 'Description for The Midnight Library.',
                availableCopies: 0,
                totalCopies: 5,
                rating: 4.5,
                coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'Klara and the Sun',
                author: kazuo._id,
                publisher: crown._id,
                isbn: '978-0-810446755',
                publishedDate: new Date('2081-01-01'),
                genres: [fiction._id, sciencefiction._id],
                description: 'Description for Klara and the Sun.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 4,
                coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'Project Hail Mary',
                author: andy._id,
                publisher: avery._id,
                isbn: '978-0-212421035',
                publishedDate: new Date('2021-01-01'),
                genres: [sciencefiction._id, adventure._id],
                description: 'Description for Project Hail Mary.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 5,
                coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'The Four Winds',
                author: kristin._id,
                publisher: riverhead._id,
                isbn: '978-0-657738748',
                publishedDate: new Date('2065-01-01'),
                genres: [historicalfiction._id, drama._id],
                description: 'Description for The Four Winds.',
                availableCopies: 0,
                totalCopies: 5,
                rating: 4,
                coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'The Invisible Life of Addie LaRue',
                author: v_e._id,
                publisher: avery._id,
                isbn: '978-0-109009215',
                publishedDate: new Date('2010-01-01'),
                genres: [fantasy._id, historicalfiction._id],
                description: 'Description for The Invisible Life of Addie LaRue.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 4.5,
                coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'The Vanishing Half',
                author: brit._id,
                publisher: harpercollins._id,
                isbn: '978-0-214403197',
                publishedDate: new Date('2021-01-01'),
                genres: [fiction._id, historicalfiction._id],
                description: 'Description for The Vanishing Half.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 4,
                coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'Hamnet',
                author: maggie._id,
                publisher: harpercollins._id,
                isbn: '978-0-520363252',
                publishedDate: new Date('2052-01-01'),
                genres: [historicalfiction._id, drama._id],
                description: 'Description for Hamnet.',
                availableCopies: 0,
                totalCopies: 5,
                rating: 3.5,
                coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'The Guest List',
                author: lucy._id,
                publisher: avery._id,
                isbn: '978-0-330316822',
                publishedDate: new Date('2033-01-01'),
                genres: [mystery._id, thriller._id],
                description: 'Description for The Guest List.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 4,
                coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'Educated',
                author: tara._id,
                publisher: riverhead._id,
                isbn: '978-0-792213710',
                publishedDate: new Date('2079-01-01'),
                genres: [biography._id, memoir._id],
                description: 'Description for Educated.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 5,
                coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'Sapiens',
                author: yuval._id,
                publisher: canongate._id,
                isbn: '978-0-474897439',
                publishedDate: new Date('2047-01-01'),
                genres: [nonfiction._id, history._id, science._id],
                description: 'Description for Sapiens.',
                availableCopies: 0,
                totalCopies: 5,
                rating: 4.5,
                coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'Atomic Habits',
                author: james._id,
                publisher: faber._id,
                isbn: '978-0-537837883',
                publishedDate: new Date('2053-01-01'),
                genres: [nonfiction._id, selfhelp._id],
                description: 'Description for Atomic Habits.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 4,
                coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            },
            {
                title: 'The Silent Patient',
                author: alex._id,
                publisher: random._id,
                isbn: '978-0-689190332',
                publishedDate: new Date('2068-01-01'),
                genres: [thriller._id, mystery._id],
                description: 'Description for The Silent Patient.',
                availableCopies: 3,
                totalCopies: 5,
                rating: 4.5,
                coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
            }
        ])

        console.log('Books inserted successfully.')
        process.exit(0)

    } catch(err) {
        console.error('Error:', err.message)
        process.exit(1)
    }
}

insertBooks()