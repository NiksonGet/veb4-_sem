const { Builder, Browser, By, until } = require('selenium-webdriver');
const fs = require('fs');
const SLEEP_TIME12 = 120000;
const SLEEP_TIME5 = 20000;
const SLEEP_TIME7 = 40000;

const withErrorHandling = (fn, handler) => {
    return async () => {
        try {
            await fn();
        } catch (error) {
            console.error(error);
            await handler();
        }
    };
};

class BasePage {
    constructor() {
        this.driver = new Builder().forBrowser(Browser.CHROME).build();
        this.driver.manage().setTimeouts({ implicit: 5000 });
    }

    async goToUrl(url) {
        await this.driver.get(url);
    }

    async enterText(locator, text) {
        await this.driver.findElement(locator).sendKeys(text);
    }

    async getText(locator) {
        return await this.driver.findElement(locator).getText();
    }

    async click(locator) {
        if (await this.isDriverActive()) {
            await this.driver.findElement(locator).click();
        } else {
            throw new Error('Driver is not active');
        }
    }
    
    async isDriverActive() {
        try {
            await this.driver.getTitle();
            return true;
        } catch (error) {
            return false;
        }
    }
    async isElementPresent(locator) {
        try {
            await this.driver.wait(until.elementIsVisible(this.driver.findElement(locator)), 10000);
            return true;
        } catch (error) {
            return false;
        }
    }

    async clickElement(locator) {
        await this.driver.wait(until.elementIsVisible(this.driver.findElement(locator)), 10000);
        await this.driver.findElement(locator).click();
    }

    async getTextFromElement(locator) {
        await this.driver.wait(until.elementIsVisible(this.driver.findElement(locator)), 10000);
        return await this.driver.findElement(locator).getText();
    }

    async getTextFromMultipleElements(locator) {
        const elements = await this.driver.findElements(locator);
        const texts = [];
        for (const element of elements) {
            texts.push(await element.getText());
        }
        return texts;
    }

    async saveScreenshot(fileName) {
        await this.driver.takeScreenshot().then((img) => {
            fs.writeFileSync(fileName, img, 'base64');
        });
    }

    async closeBrowser(delay = 0) {
        if (delay) await this.driver.sleep(delay);
        await this.driver.quit();
    }
}

class OzonPage extends BasePage {
    constructor() {
        super();
        this.URL = 'https://megamarket.ru/';
        this.xpathCatalog = "//*[@id='page-header']/div/div[1]/div/div/div/div/div[2]/div/div/div[1]";
        this.xpathCategory = "//*[@id='page-header']/div/div[1]/div/div/div/div/div[2]/div/div/div[2]/nav/div/div[1]/div/div[8]/a";
        this.xpathXbox = "//*[@id='page-header'/div/div[1]/div/div/div/div/div[2]/div/div/div[2]/nav/div/div[2]/div[2]/div[1]/div/div[1]/a";
        this.xpathTitles = "//*[@id='100027469266']/div[5]/a";
        this.xpathPrices = "//*[@id='100027469266']/div[4]/div/div[1]";
        this.xpathAddFavorites = "//*[@id='100027469266']/div[1]/div[1]/div/img";
        this.xpathRemoveFavorites = "//*[@id='100027469266']/div[1]/div[1]/div/svg";
        this.xpathFavoritesList = "//*[@id='page-header']/div/div[1]/div/div/div/div/div[6]/div/a";
        this.xpathSave = "//div[@class='_3wd6p _1ehmv']";
    }

    async openPage() {
        await this.goToUrl(this.URL);
        await this.goToUrl(this.URL);
    }

    async clickCatalogButton() {
        await this.clickElement(By.xpath(this.xpathCatalog));
    }

    async hoverCategory() {
        await this.driver.actions().move({ origin: await this.driver.findElement(By.xpath(this.xpathCategory)) }).perform();
        await this.driver.sleep(2000);
    }

    async clickElectro() {
        await this.clickElement(By.xpath(this.xpathXbox));
    }   
    async logElements() {
        const xboxTitles = await this.driver.findElements(By.xpath(this.xpathTitles));
        const xboxPrices = await this.driver.findElements(By.xpath(this.xpathPrices));
        const elements = await Promise.all(xboxTitles.slice(0, 5).map(async (el, i) => [await el.getText(), await xboxPrices[i].getText()]));
        for (let [title, price] of elements) {
            console.log(title, price);
        }
        return elements;
    }

    async addFavorites() {
        await this.click(By.xpath(this.xpathAddFavorites));
    }

    async openFavorites() {
        await this.click(By.xpath(this.xpathFavoritesList));
    }

    async getFavorites() {
        const titles = await this.getTextFromMultipleElements(By.xpath(this.xpathTitles));
        const prices = await this.getTextFromMultipleElements(By.xpath(this.xpathPrices));
        return [titles, prices];
    }

    async removeFavorites() {
        if (await this.isElementPresent(By.xpath(this.xpathRemoveFavorites))) {
            await this.clickElement(By.xpath(this.xpathRemoveFavorites));
        } else {
            console.log("Элемент 'Удалить из избранного' не найден");
        }
    }

    async refreshPage() {
        await this.driver.navigate().refresh();
    }

    async getSaveText() {
        const elem = await this.driver.findElement(By.xpath(this.xpathSave));
        return await elem.getText();
    }
}

describe("MegaMarket test", function () {
    this.timeout(100000);
    const yandexMarketPage = new OzonPage();
    let firstElem;

    before(async () => {
        await yandexMarketPage.openPage();
    });

    after(async () => {
        await yandexMarketPage.closeBrowser();
    });

    afterEach(async function () {
        if (this.currentTest.state === "failed") {
            const dateTime = new Date().toLocaleDateString();
            await yandexMarketPage.saveScreenshot(dateTime);
        }
    });

    it(
        "phone page",
        withErrorHandling(
            async () => {
                await yandexMarketPage.clickCatalogButton();
                await yandexMarketPage.hoverCategory();
                await yandexMarketPage.clickXbox();
                await yandexMarketPage.driver.sleep(SLEEP_TIME12);
            },
            async () => await yandexMarketPage.saveScreenshot("error.png"),
        )
    );

    it(
        "log titles and prices phone",
        withErrorHandling(
            async () => {
                firstElem = await yandexMarketPage.logElements();
                await yandexMarketPage.driver.sleep(SLEEP_TIME7);
            },
            async () => await yandexMarketPage.saveScreenshot("error.png"),
        )
    );

    it(
        "add to favorites",
        withErrorHandling(
            async () => {
                await yandexMarketPage.addFavorites();
            },
            async () => await yandexMarketPage.saveScreenshot("error.png")
        )
    );

    it(
        "open favorites",
        withErrorHandling(
            async () => {
                await yandexMarketPage.openFavorites();
                await yandexMarketPage.driver.sleep(SLEEP_TIME5);
            },
            async () => await yandexMarketPage.saveScreenshot("error.png")
        )
    );

    it(
        "remove favorites",
        withErrorHandling(
            async () => {
                if (await yandexMarketPage.isElementPresent(By.xpath(yandexMarketPage.xpathRemoveFavorites))) {
                    await yandexMarketPage.clickElement(By.xpath(yandexMarketPage.xpathRemoveFavorites));
                } else {
                    console.log("Элемент 'Удалить из избранного' не найден");
                }
                await yandexMarketPage.driver.sleep(SLEEP_TIME7);
            },
            async () => await yandexMarketPage.saveScreenshot("error.png")
        )
    );

    it(
        "check favorite",
        withErrorHandling(
            async () => {
                if (await yandexMarketPage.isElementPresent(By.xpath(yandexMarketPage.xpathTitles)) &&
                    await yandexMarketPage.isElementPresent(By.xpath(yandexMarketPage.xpathPrices))) {
                    const [title, price] = await yandexMarketPage.getFavorites();
                    if (title[0] !== firstElem[0][0] || price[0] !== firstElem[0][1]) {
                        throw new Error(`Expected title: ${firstElem[0][0]}, price: ${firstElem[0][1]}. Actual title: ${title[0]}, price: ${price[0]}`);
                    }
                } else {
                    console.log("Элементы на странице 'Избранное' не найдены");
                }
                await yandexMarketPage.driver.sleep(SLEEP_TIME7);
            },
            async () => await yandexMarketPage.saveScreenshot("error.png")
        )
    );

    it(
        "refresh page",
        withErrorHandling(
            async () => {
                await yandexMarketPage.refreshPage();
                const savedText = await yandexMarketPage.getTextFromElement(By.xpath(yandexMarketPage.xpathSave));
                if (savedText !== "Сохранено") {
                    throw new Error(`Expected "Сохранено", got "${savedText}"`);
                }
                await yandexMarketPage.driver.sleep(SLEEP_TIME7);
            },
            async () => await yandexMarketPage.saveScreenshot("error.png")
        )
    );
});
