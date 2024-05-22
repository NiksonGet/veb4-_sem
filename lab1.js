const assert = require('assert');
const { Builder, Browser, By} = require('selenium-webdriver');

let driver = new Builder().forBrowser(Browser.CHROME).build();

let total = 5, 
    remaining = 5; 

async function runTests() {
    try {
        await driver.get("https://lambdatest.github.io/sample-todo-app/");

        await driver.manage().window().maximize();

        await driver.sleep(2000);

        let header = await driver.findElement(By.className("ng-binding"));
        let headerText = await header.getText();

        assert.equal(headerText, "5 of 5 remaining");



        await driver.sleep(1000);


        for (let i = 1; i <= total; i++) {

            let textElement = driver.findElement(By.xpath("//span[@class='ng-binding']"));
            let text = await textElement.getText();

            let expectedText = `${remaining} of ${total} remaining`;
            assert.equal(text, expectedText);

            let item = await driver.findElement(By.xpath(`//input[@name='li${i}']/following-sibling::span`));

            let itemClass = await item.getAttribute("class");
            assert.equal(itemClass, "done-false");

            await driver.findElement(By.name("li" + i)).click();
            remaining--;

            await driver.sleep(1000);

            itemClass = await item.getAttribute("class");
            assert.equal(itemClass, "done-true");
        } 

        await driver.findElement(By.id("sampletodotext")).sendKeys("Some new cool value");
        await driver.sleep(1000);

        await driver.findElement(By.id("addbutton")).click();

        let item = await driver.findElement(By.xpath("//input[@name='li6']/following-sibling::span"));
        let itemText = await item.getText();
        let itemClass = await item.getAttribute("class");

        assert.equal(itemText, "Some new cool value");
        assert.equal(itemClass, "done-false");

        await driver.sleep(1000);

        await driver.findElement(By.name("li6")).click();

        itemClass = await item.getAttribute("class");
        assert.equal(itemClass, "done-true");

        await driver.sleep(3000);

    } catch(err) {

        driver.takeScreenshot().then(function (image) {
            require("fs").writeFileSync('screenshot.jpg', image, 'base64')
        })

        console.error("Тест упал по причине %s", err);
    } finally {
        await driver.quit();
    }
}

runTests();