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

  console.log("quiz called!")

  try{
    let {topicsDifficulty, numQuestions, threadID} = req.body;

    // TODO: FIX THIS
    
    topicString = `\nTo decide what categories to sample your questions from, select randomly from the following files.
    The higher the number assigned to the file, the less questions you should include from that topic.\n`;

    const topicNames = [
      'file-0RsHwPdoiwe9GSDpJQPs7Hgv', 'file-ybY2QBDtbDVPzfkt79ojP2Oo', 'file-MMukvwryBIsYdWWiuqbLJls0', 
      'file-isnne0m3lpgikcVcCvnyEc7E', 'file-E7PSonWaq58nOqfDVEWB0hj5', 'file-1cGmoA0KrEenDJ2TWNmA8HSC', 
      'file-srSUCNUWtdgQOKJgzQcwvgtC', 'file-lW3qahaIzA7paAeSgde00lLT'
    ];

    for(let i = 0; i < 8; i++){
      topicString+=topicNames[i]+": "+Object.values(topicsDifficulty)[i]+"\n";
    }

    console.log(topicString);

    if(!threadID){
      console.debug("No thread provided in body, creating one.");

      topicString+=`Generate a quiz with ${numQuestions} questions from the provided files IDs.`;

      const thread = await openai.beta.threads.create(
        {
          messages: [
            {
              "role": "user",
              "content": topicString
            }
          ]
        }
      );
      threadID = thread.id;
    }

    // Prepare the assistant run

    // ASSISTANTS:
    // 3.5: asst_WmczkmNAhoGad6RnL37fQq28
    // 4.0: asst_gZ83dwOH28G2qe4BLHMuUHwR

    let run = await openai.beta.threads.runs.create(
      threadID,
      {assistant_id: "asst_WmczkmNAhoGad6RnL37fQq28"}
    );
    
    console.log("Run created, checking in progress");

    // Work with thread object:

    // WE NEED TO PERIODICALLY CHECK THE THREAD

    const MAX_CALLS = 20;
    let calls = 0;

    const timer = ms => new Promise(res => setTimeout(res, ms));

    while(calls++ != MAX_CALLS){
      console.log("Checking run "+run.id+" with "+threadID);
      console.log(run);
      run = await openai.beta.threads.runs.retrieve(
        threadID,
        run.id
      );
      if(run.status == "requires_action"){
        console.log("Run at function, breaking.")
        break;
      }
      if(run.status == "failed"){
        console.log("FAILED!");
        console.log(run);

        const messages = await openai.beta.threads.messages.list(
          threadID
        );

        console.log(messages);
        for(const message of messages.data){
          console.log(message);
          console.log(message.content);
        }

        return;
      }
      if(run.status == "completed"){
        console.log("completed, breaking.")
        console.log(run);

        const messages = await openai.beta.threads.messages.list(
          threadID
        );

        console.log(messages);
        for(const message of messages.data){
          console.log(message);
          console.log(message.content);
        }

        return;
      }
      await timer(10000);
    }

    console.log(run);

    const tools = run.required_action.submit_tool_outputs.tool_calls;

    let response;

    for(let tool of tools){
      console.log(tool.function.arguments);
      response = tool.function.arguments;
      await openai.beta.threads.runs.submitToolOutputs(threadID,
        run.id,
        {
          tool_outputs: [{
            tool_call_id: tool.id,
            output: "{success: true}"
          }]
        }
      )
    }

    const messages = await openai.beta.threads.messages.list(
      threadID
    );

    for(const message of messages.data){
      console.log(message.content);
    }

    //const messages = await openai.beta.threads.messages.list(
    //  threadID
    //);

    //console.log(messages);

    //console.log(messages[0].content);
    
    res.send(response);
  }catch(error){
    console.error(error);
  }
})

app.post('/generate-quiz-1', async (req, res) => {
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