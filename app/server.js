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

// Helper Functions

// Sets a timer for specified ms
const timer = ms => new Promise(res => setTimeout(res, ms));

// Dumps all messages in the thread
const dumpMessages = async (threadID) => {
  const messages = await openai.beta.threads.messages.list(
    threadID
  );

  for(const message of messages.data){
    console.dir(message, {depth: null});
    console.dir(message.content, {depth: null});
  }
}

app.post('/generate-quiz-assistant', async (req, res) => {

  try{
    let {topicsDifficulty, numQuestions, threadID} = req.body;

    // TODO: FIX THIS

    if(!threadID){
      console.debug("No thread provided in body, creating one.");

      let topicString = "Generate a quiz with exactly "+numQuestions+" questions.";

      topicString+="Only include questions from these categories:\n"

      const topicNames = [
        'Intro Topics', 'Phonetics', 'Phonology', 
        'Morphology', 'Syntax', 'Semantics', 
        'Pragmatics', 'Language Families'
      ];
  
      for(let i = 0; i < 8; i++){
        topicString+=topicNames[i]+" (Confidence: "+Object.values(topicsDifficulty)[i]+")\n";
      }

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
      {assistant_id: "asst_gZ83dwOH28G2qe4BLHMuUHwR"}
    );
    
    console.log("Run created, checking in progress");

    // Work with thread object:

    // WE NEED TO PERIODICALLY CHECK THE RUN
    // We call the run and check its status repeatedly

    // Total attempts for calling
    const MAX_CALLS = 20;
    // How long to delay before the next call (in ms)
    const CALL_DELAY = 10000;

    let calls = 0;

    while(calls++ != MAX_CALLS){
      console.log("Checking run "+run.id+" with "+threadID);
      run = await openai.beta.threads.runs.retrieve(
        threadID,
        run.id
      );

      console.log("Run has status: "+run.status);

      // We received a function call, so we break and grab the parameters
      if(run.status == "requires_action"){
        console.log("Run at function, breaking.")
        break;
      }

      if(run.status == "failed"){
        // This is bad.
        console.log("Run failed!");
        console.dir(run);

        dumpMessages(threadID);

        return;
      }

      if(run.status == "completed"){
        // This shouldn't happen! We should always call the function.
        console.log("Run completed! Call exited.")
        console.dir(run);

        dumpMessages(threadID);

        return;

      }
      // Check every CALL_DELAY ms
      await timer(CALL_DELAY);
    }

    // Log the run
    console.log(run);

    // Get the 'tool_calls' (which should be the function)
    const tools = run.required_action.submit_tool_outputs.tool_calls;

    let toolOutput = [];
    let response;

    // We iterate through this but in reality we should only ever get one call
    for(const tool of tools){
      if(tool.type == "function"){
        response = tool.function.arguments;
        toolOutput.push({
          "tool_call_id": tool.id,
          "output": "{success: true}"
        })
      }else{
        toolOutput.push({
          "tool_call_id": tool.id,
          "output": ""
        })
      }
    }

    console.log("LOGGING THE RESPONSE\n---------------------------");
    console.log(response);
    console.log("DUMPING MESSAGES\n---------------------------");
    dumpMessages(threadID);


    // Send the response: the parameters of the function call
    res.send(response);


    // Let the function know how we did.
    // Ideally, we should actually do this *after* we send the response!
    await openai.beta.threads.runs.submitToolOutputs(threadID,
      run.id,
      {
        tool_outputs: toolOutput
      }
    )


  }catch(error){
    console.error(error);
    dumpMessages(threadID);
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
            content: `You are a helpful assistant. Create a ${numQuestions}-question quiz from the following 8 categories which are in the format "category":"confidence":"description" where confidence determines how often the categories should be picked with higher confidence meaning less of that category. Confidence is on a scale of 1 to 5, and try to use the values of confidence for the proportion of questions since a high confidence means they don't need questions of that category. If I have all confidence 5 except one category of confidence 1, that category should be the only one you make questiosn from.
            Intro Topics:${topicsDifficulty['topic1']}:Introductory Topics in linguistics cover the basics of language study. It includes understanding what linguistics is, differentiating language from other communication systems, examining language properties, and the distinction between prescriptive and descriptive grammatical approaches. It also explores the concept of arbitrariness in language signs, the Sapir-Whorf Hypothesis, and the fractal nature of language.
            Phonetics:${topicsDifficulty['topic2']}:Phonetics is the study of speech sounds and their production. It involves understanding the International Phonetic Alphabet (IPA), speech organs like the lungs and tongue, and the distinction between consonants and vowels. Phonetics also covers the classification of sounds based on articulatory properties and voicing, and the difference between monophthongs and diphthongs.
            Phonology:${topicsDifficulty['topic3']}:Phonology deals with the systematic organization of sounds in languages. It distinguishes between phonetics by focusing on the abstract aspects of sounds, like phonemes and allophones, and their distribution. Phonology involves understanding minimal pairs, phonological rules, natural classes of sounds, and phonotactic constraints.
            Morphology:${topicsDifficulty['topic4']}:Morphology is the study of the structure of words and the smallest units of meaning - morphemes. It involves distinguishing between bound and free morphemes, understanding parts of speech, differentiating between derivational and inflectional morphology, and categorizing languages as isolating or synthetic based on their morphological structures.
            Syntax:${topicsDifficulty['topic5']}:Syntax is the study of the structure of sentences, focusing on how words are arranged to convey meaning. It includes understanding concepts like constituency, syntactic hierarchy, phrase structure rules, recursion, and syntactic ambiguity. Syntax also explores how sentences can be represented through hierarchical structures like trees.
            Semantics:${topicsDifficulty['topic6']}:Semantics is concerned with the meaning of words and sentences. It involves studying semantic entailment, different types of ambiguities, the difference between connotation and denotation, and the concept of semantic prototypes. Semantics also covers lexical semantics, including word sense and relationships between words like synonyms and antonyms.
            Pragmatics:${topicsDifficulty['topic7']}:Pragmatics examines how context influences the interpretation of meaning in language. It covers the distinction between semantics and pragmatics, the cooperative principle of language, Gricean maxims, conversational implicature, and presuppositions. Pragmatics also explores speech acts, deixis, and the difference between conventional and performative sentences. 
            Language Families:${topicsDifficulty['topic8']}:This topic explores how languages are related and classified into families. It involves understanding mutual intelligibility, dialect continuums, and the methods used for language reconstruction. The topic also covers the concept of linguistic isolates and the study of major language families, such as Indo-European.
            Return your answer entirely in the form of a JSON object.
            You should only generate questions from those 8 categories.
            Questions do not have to be explicitly of that category, just related so that it tests knowledge of those categories.
            The JSON object should have a key named "questions" which is an array of questions.
            Each question in the array should be an object with the properties "query" (the question text), "choices" (an array of choice texts), "category" (the name of the category it comes from)
            "answer" (the 0-indexed number of the correct choice), and "explanation" (a brief explanation of why the answer is correct).
            The choices should not be labeled with any ordinal values like A, B, C, D or numbers like 1, 2, 3, 4. 
            Ensure the JSON is properly formatted and only includes these details. 
            `
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