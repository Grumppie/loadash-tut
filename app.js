const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const dotenv = require('dotenv');
const cors = require('cors');

// Load dotenv
dotenv.config();


const app = express();


// cors
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

const API_URL = 'https://intent-kit-16.hasura.app/api/rest/blogs';

app.get('/', (req, res) => {
    res.send('hi')
})



// Route to handle requests for blog statistics
app.get('/api/blog-stats', async (req, res) => {
    try {
        // Retrieve memoized blog statistics
        const statistics = await memoizedGetBlogStats();

        // Send the statistics as JSON response
        res.json(statistics);
    } catch (error) {
        // Handle errors and send appropriate HTTP response
        console.error('Error handling blog-stats request:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle blog search requests
app.get('/api/blog-search', async (req, res) => {
    const query = req.query.query;
    try {
        // Retrieve memoized filtered blog data based on the query
        const filteredBlogs = await memoizedSearchBlogs(query);

        // Send the filtered blog data as JSON response
        res.json(filteredBlogs);
    } catch (error) {
        // Handle errors and send appropriate HTTP response
        console.error('Error handling blog-search request:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Memoized functions for fetching and processing blog data
const memoizedGetBlogStats = _.memoize(async () => {
    try {
        // Fetch data from the external API 
        const response = await axios.get(API_URL, {
            headers: {
                'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
            }
        });

        if (response.status >= 200 && response.status < 300) {
            // Extract blog data from the response
            const blogs = response.data.blogs;

            // various statistics
            const totalBlogs = blogs.length;
            const blogWithLongestTitle = _.maxBy(blogs, blog => blog.title.length);
            const blogsWithPrivacy = _.filter(blogs, blog =>
                (blog.title && typeof blog.title === 'string') ? _.includes(blog.title.toLowerCase(), 'privacy') : false
            );
            const uniqueBlogTitles = _.uniqBy(blogs, 'title');

            //statistics object
            const statistics = {
                totalBlogs: totalBlogs,
                longestBlogTitle: blogWithLongestTitle ? blogWithLongestTitle.title : null,
                numBlogsWithPrivacy: blogsWithPrivacy.length,
                uniqueBlogTitles: uniqueBlogTitles.map(blog => blog.title)
            };

            return statistics;
        }
        else {
            console.error('Error fetching blog statistics. Status code:', response.status);
            res.status(response.status).send('Service provider is facing some problem, please try again later.')
        }

    } catch (error) {
        // Log errors and rethrow for handling in the route handlers
        console.error('Error fetching blog statistics:', error);
        throw error;
    }
});

const memoizedSearchBlogs = _.memoize(async (query) => {
    try {
        // Fetch data from the external API 
        const response = await axios.get(API_URL, {
            headers: {
                'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET
            }
        });

        if (response.status >= 200 && response.status < 300) {
            // Extract blog data from the response
            const blogs = response.data.blogs;

            // Filter blogs based on the query
            const filteredBlogs = _.filter(blogs, blog => blog.title.toLowerCase().includes(query.toLowerCase()));

            const filteredBlogsResponse = {
                "Number of Results": filteredBlogs.length,
                "Result": filteredBlogs
            }

            return filteredBlogsResponse;
        }
        else {
            console.error('Error fetching blog statistics. Status code:', response.status);
            res.status(response.status).send('Service provider is facing some problem, please try again later.')
        }

    } catch (error) {
        // Log errors and rethrow for handling in the route handlers
        console.error('Error searching blogs:', error);
        throw error;
    }
});


// Set up the server to listen on the specified port (from environment variable or default to 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
