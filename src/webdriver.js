
  require('chromedriver');
  const webdriver = require('selenium-webdriver');
  let chrome = require('selenium-webdriver/chrome');
  // Input capabilities
  const capabilities = {
//    'os_version' : 'Monterey',
//    'resolution' : '1920x1080',
//    'browserName' : 'Chrome',
//    'browser_version' : 'latest-beta',
//    'os' : 'OS X',
//    'name': 'BStack-[NodeJS] Sample Test', // test name
//    'build': 'BStack Build Number 1' // CI/CD job or build name

  }
  async function runTestWithCaps () {
    let driver = new webdriver.Builder()
    //   .usingServer('http://YOUR_USERNAME:YOUR_ACCESS_KEY@hub-cloud.browserstack.com/wd/hub')
    .forBrowser('chrome').setChromeOptions(new chrome.Options().headless())
    .build();
    await driver.get("http://www.google.com");
    const inputField = await driver.findElement(webdriver.By.name("q"));
    await inputField.sendKeys("BrowserStack", webdriver.Key.ENTER); // this submits on desktop browsers
    try {
      await driver.wait(webdriver.until.titleMatches(/BrowserStack/i), 5000);
    } catch (e) {
      await inputField.submit(); // this helps in mobile browsers
    }
    try {
      await driver.wait(webdriver.until.titleMatches(/BrowserStack/i), 5000);
      console.log(await driver.getTitle());
      await driver.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"passed","reason": "Title contains BrowserStack!"}}'
      );
    } catch (e) {
      await driver.executeScript(
        'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Page could not load in time"}}'
      );
    }
    await driver.quit();
  }
  runTestWithCaps(); 
