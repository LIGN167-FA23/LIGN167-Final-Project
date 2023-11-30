const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

app.post('/get_response', async (req, res) => {
    const user_input = req.body.user_input;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/engines/davinci-codex/completions',
            {
                prompt: user_input,
                max_tokens: 150
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const gptResponse = response.data.choices[0].text.trim();
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
