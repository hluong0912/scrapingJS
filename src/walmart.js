require('chromedriver');
const webdriver = require('selenium-webdriver');
let chrome = require('selenium-webdriver/chrome');

const express = require("express");
// const { url } = require("inspector");
// const { remote } = require('webdriverio');
var app = express();
const { MongoClient,ObjectId } = require("mongodb");
// const {configs} = require("../config")

// Connection URI
// const uri = `mongodb+srv://${configs.MONGODB_USERNAME}:${configs.MONGODB_PASSWORD}@${configs.MONGODB_PATH}`
const uri = "mongodb+srv://phandb:6ntMKKm5LfZoKBtP@cluster0.vvfo5.mongodb.net/POManagement?retryWrites=true&w=majority&maxPoolSize=10";
// Create a new MongoClient
const client = new MongoClient(uri);

async function getData(start,stop, _list){
  let browser;
  var waitingData = []
  var count = 0
  var list  = _list
  // console.log("list",list.length)
  if (list.length == 0){
    for ( chapter = start; chapter < stop; chapter++){
        list.push(chapter)
    }
  }
  console.log("total missing chapter",list)

  // args = [
  //   'headless'
  //  ];
  //  chromedriver.start(args)
  //  .then(() => {
  //    console.log('chromedriver is ready');

  //  });
  //  // run your tests
  //  chromedriver.stop();

    var opts = new chrome.Options();
    opts.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15')
    opts.addArguments('--headless')
    opts.addArguments('--disable-gpu')
  // opts.headless()
  
    
  for (const _chapter of _list){
      let driver = new webdriver.Builder()
      //   .usingServer('http://YOUR_USERNAME:YOUR_ACCESS_KEY@hub-cloud.browserstack.com/wd/hub')
      .forBrowser('chrome')
      .setChromeOptions(opts)
      // .withCapabilities(opts)
      .build();
      const chapter = parseInt(_chapter)
      let url = `https://www.lightnovelpub.com/novel/peerless-martial-god-2/598-chapter-${chapter}`
      console.log(url)
      // browser = await remote({
      //   capabilities: {
      //       browserName: 'chrome',
      //       chromeOptions: {
      //       args: [
      //         'headless',
      //         // Use --disable-gpu to avoid an error from a missing Mesa
      //         // library, as per
      //         // https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
      //         'disable-gpu',
      //         ],
      //       logLevel: "silent"}
      //       }
      // })

      //GET URL AND FIND ALL ELEMENTS
      // await browser.url(url)
      // let apiLink = await browser.$('#chapter-container')
      // let body = await apiLink.getText()
      // let title = await browser.$('/html/body/main/article/section[1]/div[2]/h1/span[2]')
      await driver.get("https://www.lightnovelpub.com/novel/peerless-martial-god-2/598-chapter-1000")//get("https://google.com");
      const divChapter = await driver.findElement(webdriver.By.id("chapter-container"));
      const divTitle = await driver.findElement(webdriver.By.xpath("/html/body/main/article/section[1]/div[2]/h1/span[2]"));
      // console.log(await inputField.getText())
      // console.log(await title.getText())
      let body = await divChapter.getText()
      let title = await divTitle.getText()
      // console.log({title,url,chapter})
      let isContentExist = await IsExist(title,url,chapter)
      
      if(isContentExist === null && waitingData[chapter] === undefined){
        waitingData[chapter] = {
          chapter:chapter,
          url:url,
          title: title,
          body:body,
          length:body.length,
          created: new Date(),
          latest: new Date()
        }
        count++
      }

      if(count%5 === 0)
      {
        await InsertBulkToDB(waitingData)
        // await browser.pause(3000)
        count = 0
        waitingData = []
      }
      // await browser.deleteSession()
      driver.close()
    }
}
async function IsExist(title,url,chapter) {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");

    var mongodb = await client.db()
    var test = await mongodb.collection('Manga').findOne({
        chapter : parseInt(chapter),
        url:url,
        title: title,
    })
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    return test
  }
}

async function InsertBulkToDB(waitingData){
  console.log("buLK")
  for(const chapter in waitingData){
    let manga = waitingData[chapter]
    // InsertToDB(manga.title,manga.body,manga.url,chapter)
    console.log("inserting manga"+manga.chapter,manga.title)
    // await InsertToDB(manga.title,manga.body,manga.url,manga.chapter)
  }
}

async function InsertToDB(title,body,url,chapter) {
  try {
    
    // Connect the client to the server
    await client.connect();
    
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    
    console.log("Connected successfully to server");

    var mongodb = await client.db()
    
    var test = await mongodb.collection('Manga').insertOne({
        chapter:chapter,
        url:url,
        title: title,
        body:body,
        length:body.length,
        created: new Date(),
        latest: new Date()
    },async (err,doc)=>{
      if (err) console.log(err)
      console.log("successfor chapter",doc)
      
    })
    console.log(test)
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

async function checkData(arr){
  var miss = []
  var dict = []
  var dup = []
  for (const _c in arr){
    let chapter = arr[_c].chapter
    if (dict[chapter] == undefined){
      dict[chapter] = chapter
    }
    else{
      dup[chapter] = arr[_c]
    }
  }
  
  for (i=400; i < 1700; i++){
    if (dict[i] == undefined){
        miss.push(i)
    }
  }
  
  console.log(dup)
  console.log("duplicate",dup.length)
  console.log("missing", miss.length)
  return miss
}

async function getDataWholeDocument(){
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");
    let query = {} //{chapter : {$gt : 1400}}
    const options = {
              // sort returned documents in ascending order by title (A->Z)
              sort: { title: 1 },
              // Include only the `title` and `imdb` fields in each returned document
              projection: { _id: 1, title: 1, chapter: 1 },
    }
    
    var mongodb = await client.db()
    
    var returnData = await mongodb.collection('Manga')
    .find(query,options)
    
    if ((await returnData.count()) === 0) {
        console.log("No documents found!");
    }

    var list = await returnData.toArray()
    console.log(list.length)
    // console.log(list)
    console.log(await returnData.count())
    var missingChapters = checkData(list)
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    return missingChapters
  }
}

async function UpdateLength() {
  try {
    let dict = []
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to server");
    var mongodb = await client.db()
    var test = await mongodb.collection('Manga').find({length: { $exists: false }}).toArray()
    console.log(test.length)
    for(const chapter in test){
      let element =  test[chapter]
      // console.log(element)
      if (element.body != null ){
        // console.log(element.chapter,element.length)
        dict[parseInt(element.chapter)] = {
                                _id: ObjectId(element._id),
                                // chapter : parseInt(element.chapter),
                                // url:element.url,
                                // title: element.title,
                                // body:element.body,
                                length:element.body.length,
                                created: element.created == null ? new Date() : element.created,
                                latest: new Date()
                                }
        // console.log("chaper "+element.chapter,element._id)
        // console.log("chaper "+element.chapter,dict[element.chapter]._id.toString())
        
        // if (element.chapter > 410)continue
      // if (element.chapter < 404)continue
        // if (element.chapter > 403)break;
      }
    };

    for (const _chapter in dict){
      await mongodb.collection('Manga').updateOne(
        {_id: dict[_chapter]._id},
        {$set: dict[_chapter]}, 
        {},
        function(err,doc) {
          if (err) { throw err;}
          else {
            console.log("Updated chapter"+_chapter, doc)
            console.log(""+_chapter, {"chapter": _chapter, "_id": dict[_chapter]._id})
        }
      });  
    }
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

app.get("/url", (req, res, next) => {
    res.json(["Tony","Lisa","Michael","Ginger","Food"]);
   });

app.listen(3001, async () => {
 console.log("Server running on port 3000");
  await getData(0,0,await getDataWholeDocument())
//  await getData(1381,1385)
// await UpdateLength()
});
// {chapter: {$gte: 1361, $lte:1380}}
