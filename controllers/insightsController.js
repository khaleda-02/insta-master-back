const asyncHandler = require("express-async-handler");
const axios = require("axios");
const { Insights } = require("../models");
const { init } = require("../models/insightsModel");
require('dotenv').config();
const instaScrapApiKey = process.env.INSTA_SCRAP_API_KEY;
const instaScrapApiHost = process.env.INSTA_SCRAP_API_HOST; 

//COUMUINCATE WITH 3RD PARTY API:
// @desc    Get user id
// @access  Private
const getUserIdApi = asyncHandler(async (username) => {
  const options = {
    method: "GET",
    url: "https://instagram-scraper-2022.p.rapidapi.com/ig/user_id/",
    params: {
      user: username,
    },
    headers: {
      "X-RapidAPI-Key": instaScrapApiKey,
      "X-RapidAPI-Host": instaScrapApiHost,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data.id;
  } catch (error) {
    console.error(error);
  }
});
// @desc  Get user posts
// @access  Private
const getUserPostsApi = asyncHandler(async (req) => {
  console.log("userin API FUNCTION ", req.user_id);
  const options = {
    method: "GET",
    url: "https://instagram-scraper-2022.p.rapidapi.com/ig/posts/",
    params: {
      // id_user: user_id,
      id_user: req.user_id,
    },
    headers: {
      "X-RapidAPI-Key": instaScrapApiKey,
      "X-RapidAPI-Host": instaScrapApiHost,
    },
  };

  try {
    const response = await axios.request(options);
    console.log(response);
    return response.data.data.user;
  } catch (error) {
    console.error(error);
  }
});

// @desc  Get user's followers
// @access  Private
const getUserFollowersApi = asyncHandler(async (req) => {
  const options = {
    method: "GET",
    url: "https://instagram-scraper-2022.p.rapidapi.com/ig/followers/",
    params: {
      id_user: req.user_id,
    },
    headers: {
      "X-RapidAPI-Key": instaScrapApiKey,
      "X-RapidAPI-Host": instaScrapApiHost,
    },
  };

  try {
    const response = await axios.request(options);
    // console.log(response.users);
    return response.data.users;
  } catch (error) {
    console.error(error);
  }
});
// @desc  Get user's info
// @access  Private
const getUserInfoApi = asyncHandler(async(req)=>{
  const options = {
    method: 'GET',
    url: 'https://instagram-scraper-2022.p.rapidapi.com/ig/info_username/',
    params: {
      user: req.username
    },
    headers: {
      'X-RapidAPI-Key': instaScrapApiKey,
      'X-RapidAPI-Host': instaScrapApiHost
    }
  };
  try {
    const response = await axios.request(options);
    // console.log(response.user);
    return response.data.user;
  } catch (error) {
    console.error(error);
  }
})
//  @desc Get user's following
// @access  Private
const getUserFollowingApi = asyncHandler(async (req) => {
  const options = {
    method: "GET",
    url: "https://instagram-scraper-2022.p.rapidapi.com/ig/following/",
    params: {
      id_user: req.user_id,
    },
    headers: {
      "X-RapidAPI-Key": instaScrapApiKey,
      "X-RapidAPI-Host": instaScrapApiHost,
    },
  };

  try {
    const response = await axios.request(options);
    // console.log(response.data);
    return response.data.users;
  } catch (error) {
    console.error(error);
  }
});

// @desc   Extract user insights
// @access  Private
const extractPostsInfo = asyncHandler(async (user_id) => {
  const user_posts = await getUserPostsApi({ user_id });
  console.log(user_posts);
  const posts_info = [];
  for (edge of user_posts["edge_owner_to_timeline_media"]["edges"]) {
    const post_info = {
      type: edge.node.is_video ? "video" : "image",
      text: edge.node.edge_media_to_caption.edges[0].node.text,
      comment_number: edge.node.edge_media_to_comment.count,
      like_number: edge.node.edge_media_preview_like.count,
      timestamp: new Date(edge.node.taken_at_timestamp).toLocaleTimeString(
        "en-US"
      ),
      tagged_users: edge.node.edge_media_to_tagged_user,
    };
    posts_info.push(post_info);
  }

  return JSON.stringify(posts_info);
});

// @desc   Extract user followers
// @access  Private
const extractFollowersInfo = asyncHandler(async (user_id) => {
  const followers = await getUserFollowersApi({ user_id });
  const followers_info = [];
  // console.log( followers);
  for (follower of followers) {
    const follower_info = {
      username: follower.username,
      fullname: follower.full_name,
      is_private: follower.is_private,
      is_verified: follower.is_verified,
      is_possible_scammer: follower.is_possible_scammer,
      has_anonymous_profile_picture: follower.has_anonymous_profile_picture,
    };
    followers_info.push(follower_info);
  }

  return JSON.stringify(followers_info);
});
// @desc   Extract user followings
// @access  Private
const extractFollowingInfo = asyncHandler(async (user_id) => {
  const followings = await getUserFollowingApi({ user_id });
  const followings_info = [];
  // console.log( followers);
  for (following of followings) {
    const following_info = {
      username: following.username,
      fullname: following.full_name,
      is_private: following.is_private,
      is_verified: following.is_verified,
      is_possible_scammer: following.is_possible_scammer,
      has_anonymous_profile_picture: following.has_anonymous_profile_picture,
    };
    followings_info.push(following_info);
  }

  return JSON.stringify(followings_info);
});

// @desc   Fetch user insights
// after authentication
// @access  Private
const createInsights = asyncHandler((_id, instaId) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Begin of create");
      // Insights not found: so create
      const posts = await extractPostsInfo(instaId); //posts
      const followers = await extractFollowersInfo(instaId); //followers
      const following = await extractFollowingInfo(instaId); //following
      // const highlights = await extractHighlightsInfo(instaId); //highlights
      console.log("3rd party api call done");

      const insights = await Insights.create({
        userId: _id,
        posts,
        followers,
        following,
        highlights: [],
      });
      console.log("create insights");

      if (!insights) {
        resolve({
          status: false,
          message: "Insights not created",
        });
      }

      resolve({
        status: true,
        data: insights,
      });
    } catch (error) {
      reject({
        status: true,
        message: "Error in creating insights",
      });
    }
  });
});

// @desc   Fetch user insights
// @route  GET /api/content/insights
// @access  Private
const fetchInsights = asyncHandler(async (req, res) => {
  console.log("Im here in fetchInsights", new Date());
  const { _id, instaId } = req.user;
  console.log("user", req.user);
  const insights = await Insights.findOne({ userId: _id });
  // console.log("found Insights",  insights);
  if (insights) {
    res.status(200).json({
      status: true,
      message: "Insights fetched successfully",
      data: insights,
    });
  }
else{
  createInsights(_id, instaId)
    .then((response) => {
      console.log("response", response);
      if (response.status)
        re.status(200).json({
          status: true,
          message: "Insights fetched successfully",
          data: response.insights,
        }); //create insights successfully
      res.status(400).json({
        status: false,
        message: "Insights not fetched",
      }); // failed in creation
    })
    .catch((error) => {});
  }
});

module.exports = { getUserIdApi, fetchInsights,getUserInfoApi  };
