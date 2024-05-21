const assert = require('assert');
const { Builder, By } = require('selenium-webdriver');

let driver = new Builder().forBrowser('chrome').build();

async function runTests() {
  try {
    await driver.get("https://lambdatest.github.io/sample-todo-app/");
    await driver.manage().window().maximize();
    await driver.sleep(1000);
    
    const title = await driver.getTitle();
    assert.equal(title, "Sample page - lambdatest.com");

    let textElement = await driver.findElement(By.xpath("//span[contains(@class, 'ng-binding')]"));
    let text = await textElement.getText();
    assert.equal(text, "5 of 5 remaining");

    let firstListItem = await driver.findElement(By.xpath("//ul/li[1]"));
    let firstItemClass = await firstListItem.getAttribute("class");
    assert.equal(firstItemClass.includes("done-true"), false);

    await driver.findElement(By.xpath("//ul/li[1]/input")).click();

    firstItemClass = await firstListItem.getAttribute("class");
    assert.equal(firstItemClass.includes("done-false"), false);

    for (let i = 1; i <= 5; i++) {
      let listItem = await driver.findElement(By.xpath(`//ul/li[${i}]`));
      await driver.findElement(By.xpath(`//ul/li[${i}]/input`)).click();
      let itemClass = await listItem.getAttribute("class");
      assert.equal(itemClass.includes("done-false"), false);
    }

    await driver.findElement(By.id("sampletodotext")).sendKeys("New Item");
    await driver.findElement(By.id("addbutton")).click();

    let newItem = await driver.findElement(By.xpath("//ul/li[6]"));
    await newItem.click();

    firstItemClass = await firstListItem.getAttribute("class");
    assert.equal(firstItemClass.includes("done-true"), false);

    console.log('All steps executed successfully');
  } catch (err) {
    await driver.takeScreenshot().then(function (image) {
      require('fs').writeFileSync('screenshot_error.png', image, 'base64');
    });
    console.error('Error executing the test: %s', err);
  } finally {
    await driver.quit();
  }
}

runTests();