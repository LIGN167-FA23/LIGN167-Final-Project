require('dotenv').config();
const cors = require('cors');
const OpenAI = require('openai');
const express = require('express');
const bodyParser = require("body-parser");


const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate-quiz', async (req, res) => {
  try {
    const { topic, difficulty, numQuestions } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Create a ${numQuestions}-question quiz about ${topic} for a ${difficulty} level.
          Return your answer entirely in the form of a JSON object. The JSON object should have a key named "questions" which is an array of questions.
          Each question in the array should be an object with the properties "query" (the question text), "choices" (an array of choice texts),
          "answer" (the 0-indexed number of the correct choice), and "explanation" (a brief explanation of why the answer is correct).
          The choices should not be labeled with any ordinal values like A, B, C, D or numbers like 1, 2, 3, 4. 
          Ensure the JSON is properly formatted and only includes these details.`
        },
        { 
          role: "user", 
          content: "Please generate the quiz." 
        },
      ]
    });
    res.send(completion.choices[0].message.content);
    console.log(completion.choices[0].message.content)
  } catch (error) {
    res.status(500).send(error);
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});