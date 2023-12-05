const OpenAI = require('openai');
const express = require('express');
const bodyParser = require("body-parser");
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/get_response', async (req, res) => {
    const user_input = req.body.user_input;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            max_tokens: 300,
            messages: [{role: "user", content: user_input}]
          })
        const gptResponse = response.choices[0].message.content
        const modifiedResponse = modifyGptResponse(gptResponse);
        res.send(modifiedResponse);
    } catch (error) {
        console.error(error);
        res.send("Error: Unable to get response from the API");
    }
});
function modifyGptResponse(response) {
    // Modify the response here
    return "GPT says: " + response;
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
