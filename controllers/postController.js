const asyncHandler = require("express-async-handler");
const axios = require("axios");
const { Post } = require("../models");

//@ des    create post
//@ POST   /api/content/create-post
//@ access protected
const createPost = asyncHandler(async (req, res) => {
  let { title, timeToShare } = req.body;
  console.log("timeToShare", new Date(timeToShare));
  const user = req.user;
  if (!title) {
    res.status(400);
    throw new Error("Please provide a title.");
  }

  // Get top 10 hashtags for the title
  const topTenHashtags = await getHashtags(title);

  // Get image URL for the title
  const imgUrl = await getImages(title);

  // Generate caption using Hugging Face's GPT-2 model
  const caption = await getCaption(title, 0.8);
  // Send response back to client

  const post = await Post.create({
    userId: user._id,
    title: title,
    imgUrl: imgUrl,
    caption: caption,
    hashTags: topTenHashtags,
    timeToShare: new Date(timeToShare),
  });
  if (!post) {
    res.status(400);
    throw new Error("Some thing went wrong");
  }
  res.status(200).json({
    status: true,
    message: "Post created successfully",
    data: post,
  });
});

//@ des    delete post
//@ DELETE   /api/content/delete-post/:id
//@ access protected
const deletePost = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  // Check if post exists
  const post = await Post.findById(id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check if authenticated user created the post
  if (post.userId.toString() !== user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to delete this post");
  }

  // Delete post
  const response = await Post.deleteOne({ _id: id });
  if (!response) {
    res.status(400);
    throw new Error("Something went wrong");
  }

  res.status(200).json({
    status: true,
    message: "Post deleted successfully",
    data: {
      _id: id,
    },
  });
});

//@ des    update post
//@ PUT   /api/content/update-post/:id
//@ access protected
const updatePost = asyncHandler(async (req, res) => {
  let { caption } = req.body;
  const user = req.user;

  // Get the ID of the post to update from the request params
  const { id } = req.params;

  // Check if post exists
  const post = await Post.findById(id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check if authenticated user created the post
  if (post.userId.toString() !== user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to update this post");
  }

  // Validate inputs
  if (!caption) {
    res.status(400);
    throw new Error("Please provide a caption.");
  }

  // Update post
  const response = await Post.updateOne(
    { _id: id },
    {
      caption: caption,
    },
  );

  if (!response) {
    res.status(400);
    throw new Error("Something went wrong");
  }

  const updatedPost = await Post.findOne({ _id: id });

  res.status(200).json({
    status: true,
    message: "Post updated successfully",
    data: updatedPost,
  });
});

//@ des    update post
//@ GET   /api/content/get-posts-by-day
//@ access protected
const getPostByDay = asyncHandler(async (req, res) => {
  const user = req.user;
  const { date } = req.params;
  const day = new Date(date); // convert day to a Date object
  console.log("req.params", day);
  const posts = await Post.find({ userId: user._id, timeToShare: day });
  if (!posts) {
    res.status(400);
    throw new Error("Something went wrong");
  }
  res.status(200).json({
    status: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});

//@ des    get post
//@ GET   /api/content/get-posts
//@ access protected
const getPosts = asyncHandler(async (req, res) => {
  const user = req.user;
  const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });
  if (!posts) {
    res.status(400);
    throw new Error("Some thing went wrong");
  }
  res.status(200).json({
    status: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});

//@ des    get post by month
//@ GET   /api/content/get-posts-by-month
//@ access protected

const getPostByMonth = asyncHandler(async (req, res) => {
  const user = req.user;
  const { date } = req.body;

  const [selectedYear, selectedMonth] = date.split("/");
  const posts = await Post.find({
    userId: user._id,
    timeToShare: {
      $gte: new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1),
      $lt: new Date(parseInt(selectedYear), parseInt(selectedMonth), 1),
    },
  });

  if (posts.length === 0) {
    res.status(400);
    throw new Error(`No posts found for month ${date}`);
  }

  res.status(200).json({
    status: true,
    message: "Posts fetched successfully",
    data: posts,
  });
});

//! extra functions
const getHashtags = async (title) => {
  try {
    const { data } = await axios.post(
      "https://hashtags.nextstapp.net/api/list/get-hashtag",
      {
        hashtag: title,
      },
      {
        headers: {
          "x-token": "yXUIaJdMQc0wFPqfrLnrN5YEa43AKf7w",
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      },
    );
    const { instagram_suggestions } = data;
    const topTenHashtags = Object.keys(instagram_suggestions).slice(0, 10);
    return topTenHashtags;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data from API" });
  }
};

const getImages = async (title) => {
  try {
    const { data } = await axios.get(
      `https://api.unsplash.com/search/photos?query=${title}`,
      {
        headers: {
          Authorization: process.env.IMG_API_TOKEN,
        },
      },
    );
    const { results } = data;

    if (results.length == 0) {
      return null;
    }

    const imgUrl = results[0].urls.regular;
    return imgUrl;
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error fetching data from API" });
  }
};

const generateText = async (prompt) => {
  try {
    const { data } = await axios.post(
      "https://api-inference.huggingface.co/models/gpt2/generate",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.5,
          num_return_sequences: 1,
        },
      },
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
      },
    );

    console.log(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data from API" });
  }
};
// TODO: TRIM CAPTION
const getCaption = async (keyword, temperature) => {
  try {
    const { data } = await axios.get(
      `http://127.0.0.1:5000/generate?keyword=${keyword}&temperature=${temperature}`,
      {
        headers: {
          Authorization: process.env.IMG_API_TOKEN,
        },
      },
    );
    const { generated_text } = data;
    return generated_text;
  } catch (error) {
    console.error(error);
  }
};
// getCaption('cat',0.8);

module.exports = {
  createPost,
  getPosts,
  deletePost,
  updatePost,
  getPostByDay: getPostByDay,
  getPostByMonth,
};
