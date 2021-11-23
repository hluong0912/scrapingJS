require('chromedriver');
const webdriver = require('selenium-webdriver');
let chrome = require('selenium-webdriver/chrome');

const express = require("express");
// const { url } = require("inspector");
// const { remote } = require('webdriverio');
var app = express();
// const { runTest } = require('tslint/lib/test');
// const {configs} = require("../config")
const { MongoClient,ObjectId } = require("mongodb");

// Connection URI
const uri = "mongodb+srv://phandb:6ntMKKm5LfZoKBtP@cluster0.vvfo5.mongodb.net/POManagement?retryWrites=true&w=majority&maxPoolSize=100";
// Create a new MongoClient
const client = new MongoClient(uri);
var dataWaitingForUpload = []
var opts = new chrome.Options();
opts.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15')
opts.addArguments('--headless')
opts.addArguments('--disable-gpu')

var lock = []

async function accessWebAndImportToDB(driver,chapter,url){
    console.log(url)
    await driver.get(url)
    const divChapter = await driver.findElement(webdriver.By.id("chapter-container"));
    const divTitle = await driver.findElement(webdriver.By.xpath("/html/body/main/article/section[1]/div[2]/h1/span[2]"));
    // console.log(await inputField.getText())
    // console.log(await title.getText())
    let body = await divChapter.getText()
    let title = await divTitle.getText()
    // console.log({title,url,chapter})
    let isContentExist = await IsExist(title,url,chapter)
    
    if(isContentExist == null && dataWaitingForUpload[chapter] === undefined){
      dataWaitingForUpload[chapter] = {
        url:url,
        title: title,
        body:body,
        length:body.length,
        created: new Date(),
        latest: new Date()
      }
      // count++
      // console.log(dataWaitingForUpload)
    }
    InsertToDB(title,body,url,chapter)
    // if(count%5 === 0)
    // {
    //   await InsertBulkToDB(waitingData)
    //   // await browser.pause(3000)
    //   count = 0
    //   waitingData = []
    // }
}

async function getData(start,stop, _list){
  // let browser;
  // var waitingData = []
  // var count = 0
  var list  = _list == null ? [] : _list
  // console.log("list",list.length)
  if (list.length == 0){
    for ( chapter = start; chapter < stop; chapter++){
        list.push(chapter)
    }
  }
  console.log("total missing chapter",list)

  for (const _chapter in list){
      let _count = 1
      while (lock.length >= 10){
        await checkingLock(2000)
        console.log(lock.length,_count)
        _count++
        if ( _count > 100)
        break;
      }
      let chapter = parseInt(list[_chapter])
      let url = `https://www.lightnovelpub.com/novel/peerless-martial-god-2/598-chapter-${chapter}`
      lock.push(url)
      console.log("just push",lock.length)
      runTest(chapter,url)
  }
}
function checkingLock(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function runTest(chapter,url){

  let driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setChromeOptions(opts)
      .build();
      
  await accessWebAndImportToDB(driver,chapter,url)
  // await browser.deleteSession()
  driver.close()
  lock.pop()
  console.log("just pop",lock.length)
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
      await client.close();
    })
    // console.log(test)
  } finally {
    // Ensures that the client will close when you finish/error
    

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
  console.log("missing", miss)
  console.log("duplicate",dup.length)
  
  console.log("missing", miss.length)

  return miss
}

async function getDataWholeDocument(){
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Connected successfully to server");
    let query = {chapter : {$gte : 400, $lte: 1745}}
    const options = {
              // sort returned documents in ascending order by title (A->Z)
              // sort: { title: 1 },
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
//  await getData(0,0,await getDataWholeDocument())
getData(1700,1750, null)
// getData(1181,1185,null)
// getData(1081,1085,null)
// getData(991,1000,null)
// getData(1001,1010,null)
// await getDataWholeDocument()
// await UpdateLength()
});
// {chapter: {$gte: 1361, $lte:1380}}
