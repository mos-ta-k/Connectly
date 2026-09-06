const express = require("express");
const router = express.Router();

router.post("/login", (req, res) =>{
    res.send("login endpoint");
})

router.post("/register", (req, res) =>{
    res.send("register endpoint");
})

router.post("/logout", (req, res) =>{
    res.send("logout endpoint");
})

module.exports = router;