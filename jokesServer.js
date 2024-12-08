const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "credentials/.env") });
const uri = process.env.MONGO_CONNECTION_STRING;
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.argv[2] || 3000;
const databaseAndCollection = {
  db: "JOKES_DB",
  collection: "jokesCollection",
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");

console.log(`Web server started and running at http://localhost:${port}`);
const prompt = "stop to shutdown the server: ";
process.stdout.write(prompt);

// Start server
app.listen(port);

app.get("/", (request, response) => {
  response.render("index");
});

app.get("/placeRequest", (request, response) => {
  const portNum = { port: port };
  response.render("placeRequest", portNum);
});


  

    async function insertApp(client, databaseAndCollection, jokes) {
      const result = await client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(jokes);
    }

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Function to fetch jokes from the API
async function fetchJokes(type, number) {
  try {
    // Construct the API URL based on the type and number of jokes
    const apiURL =
      type === "random"
        ? `https://official-joke-api.appspot.com/jokes/random/${number}`
        : `https://official-joke-api.appspot.com/jokes/${type}/ten`;

    // Fetch jokes from the API
    const response = await fetch(apiURL);

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Parse the JSON respons
    const jokes = await response.json();
    for(let i=0; i< jokes.length; i++){
      insertApp(client, databaseAndCollection, jokes[i]);
    }
    
    return jokes;
  } catch (error) {
    console.error("Error fetching jokes:", error.message);
    return [];
  }
}
app.get("/selectByType", (request, response) => {
  const portNum = { port: port };
  response.render("selectByType", portNum);
});


// Form Submission Route
app.post("/jokesSubmit", async (req, res) => {
  try {
    const { name, numberJokes, type } = req.body;
    const number = parseInt(numberJokes);

    // Fetch jokes based on user input
    const jokes = await fetchJokes(type, number);

    const form = {
      name: name,
      amt: number,
      type: type,
      jokes: jokes,
    };
    
    res.render("jokesSubmit", { form: form });
  } catch (error) {
    console.error("Error submitting jokes:", error);
    res.status(404).send("Error submitting jokes");
  }
});

app.post("/jokesconfirm", async (req, res) => {
  try {
    await client.connect();

    let type = req.body.type;

    let array = await lookUpMany(client, databaseAndCollection, type);
    let ans = `<table border = '1'> <tr><th>Setup</th><th>Punchline</th></tr>`;
    array.forEach((el) => {
      ans += `<tr><td>${el.setup}</td><td>${el.punchline}</td></tr>`;
    });
    ans += `</table>`;
    res.render("jokesconfirm", { jokesselected: ans });
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
});

app.get("/removeAllJokes", (request, response) => {
  const portNum = { port: port };
  response.render("removeAllJokes", portNum);
});

app.post("/removeAllJokesconfirm", async (req, res) => {
  try {
    await client.connect();

    const result = await client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .deleteMany({});
    const deleted = { num: result.deletedCount };
    res.render("removeAllJokesconfirm", deleted);
  } catch (error) {
    console.error("Error removing jokes:", error);
    res.status(500).send("Error removing jokes");
  }
});
async function lookUpMany(client, databaseAndCollection, type) {
  let filter = { type: { $eq: type } };
  const cursor = client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

  // Some Additional comparison query operators: $eq, $gt, $lt, $lte, $ne (not equal)
  // Full listing at https://www.mongodb.com/docs/manual/reference/operator/query-comparison/
  const result = await cursor.toArray();
  return result;
}






process.stdin.on("readable", () => {
  /* on equivalent to addEventListener */
  const dataInput = process.stdin.read();
  if (dataInput !== null) {
    const command = String(dataInput).trim().toLowerCase();

    if (command === "stop") {
      console.log("Shutting down the server");
      process.exit(0); /* exiting */
    }
  }
});

