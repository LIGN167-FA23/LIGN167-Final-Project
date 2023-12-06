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

app.post('/generate-quiz-assistant', async (req, res) => {

  console.log("quiz called!")

  try{
    let {topics, numQuestions, threadID} = req.body;

    // TODO: Retrieve list of topics to cover!
    
    if(!threadID){
      console.debug("No thread provided in body, creating one.");

      let contentString = `Generate a quiz with ${numQuestions} questions from the provided files.`

      const thread = await openai.beta.threads.create(
        {
          messages: [
            {
              "role": "user",
              "content": contentString
            }
          ]
        }
      );
      threadID = thread.id;
    }

    // Prepare the assistant run

    const run = await openai.beta.threads.runs.create(
      threadID,
      {assistant_id: "asst_gZ83dwOH28G2qe4BLHMuUHwR"}
    );
    
    console.log("Run created, checking in progress");

    // Work with thread object:

    // WE NEED TO PERIODICALLY CHECK THE THREAD

    const MAX_CALLS = 10;
    let calls = 0;

    const checkRun = async () => {
      setTimeout(async () => {
        console.log("Checking run.");
        const runCheck = await openai.beta.threads.retrieve(
          threadID,
          run.id
        );

        if(runCheck.status != "completed"){
          if(calls++ == MAX_CALLS) return false;
          checkRun();
        }

        // Successfully found a completed status
        return true;

      }, 10000)
    }

    // I mean, ideally use Enums but whatever
    const runSuccess = await checkRun();

    // This is wrong; we need to wait for the queue to get in.

    if(!runSuccess){
      // The run failed, throw an error
      console.error("The run hit max calls!");
      return;
    }

    console.log("Try to retrieve the message responses.")

    const messages = await openai.beta.threads.messages.list(
      threadID
    );

    console.log(messages[0].content);

    res.send(messages[0].content);

  }catch(error){
    console.error(error);
  }
})

app.post('/generate-quiz', async (req, res) => {
  try {
    const { topicsDifficulty, numQuestions } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
            role: "system",
            content: `You are a helpful assistant. Create a ${numQuestions}-question quiz about Linguistics.
            Return your answer entirely in the form of a JSON object. The JSON object should have a key named "questions" which is an array of questions.
            Each question in the array should be an object with the properties "query" (the question text), "choices" (an array of choice texts),
            "answer" (the 0-indexed number of the correct choice), and "explanation" (a brief explanation of why the answer is correct).
            The choices should not be labeled with any ordinal values like A, B, C, D or numbers like 1, 2, 3, 4. 
            Ensure the JSON is properly formatted and only includes these details.`
        //   content: `You are a helpful assistant. Create a ${numQuestions}-question quiz about ${topic} for a ${difficulty} level.
        //   Return your answer entirely in the form of a JSON object. The JSON object should have a key named "questions" which is an array of questions.
        //   Each question in the array should be an object with the properties "query" (the question text), "choices" (an array of choice texts),
        //   "answer" (the 0-indexed number of the correct choice), and "explanation" (a brief explanation of why the answer is correct).
        //   The choices should not be labeled with any ordinal values like A, B, C, D or numbers like 1, 2, 3, 4. 
        //   Ensure the JSON is properly formatted and only includes these details.`
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