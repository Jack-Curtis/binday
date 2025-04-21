import { Given, When, Then } from "@cucumber/cucumber";
import { testEvolve } from "@testevolve/testevolve-spark";
import moment from "moment";
import { By } from "selenium-webdriver";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

Given(/^I navigate to the correct URL$/, async () => {
  console.log("bot token = ", process.env.TELEGRAM_BOT_TOKEN);
  await testEvolve.browser.goto("https://ilforms.wiltshire.gov.uk/WasteCollectionDays/index");
});

When(/^I input my postcode$/, async () => {
  await testEvolve.browser.textField({ id: "Postcode" }).click();
  await testEvolve.browser.textField({ id: "Postcode" }).set("sn152ga");
  await testEvolve.browser.button({ id: "AddressFinder" }).click();
  await testEvolve.browser.driver.sleep(1000)
  await testEvolve.browser.select({ xpath: "//*[@id='Uprn']/option[@value='010096750852']" }).click();
  await testEvolve.browser.driver.sleep(1000)
});

Then(/^The calendar component appears$/, async () => {
  if (!await testEvolve.browser.header({ class: "collection-calendar-header" }).exists()) throw new Error("Element was not displayed on the page before timeout");
  if (!await testEvolve.browser.header({ class: "collection-calendar-header" }).isVisible()) throw new Error("Element was not visible on the page before timeout");
});

Then(/^Send all the collection dates$/, async () => {
  const events = await testEvolve.browser.driver.findElements(By.className("events-list"));

  const thisMonthsEventsLinks = await Promise.all(events.map(async event => await event.findElement(By.css("a"))))
  const thisMonthsEventsDetails = await Promise.all(thisMonthsEventsLinks.map(async link => ({ date: await link.getAttribute("data-original-datetext"), type: await link.getAttribute("data-original-title")})));

  const tomorrow = moment().add("1", "days").endOf("day");
  const today = moment().endOf("day");

  thisMonthsEventsDetails.forEach(detail => {
    const eventDatetime = moment(new Date(detail.date)).endOf("day");
    const isTomorrow = tomorrow.diff(eventDatetime, "days") === 0;
    const isThisWeek = eventDatetime.diff(today, "days") <= 7 && eventDatetime.diff(today, "days") >= 0 && today.day() === 1;

    if (isThisWeek) console.log(`The ${detail.type} gets collected on ${eventDatetime.format("dddd")}`);
    if (isThisWeek) sendTelegramMessage(`The ${detail.type} gets collected on ${eventDatetime.format("dddd")}`)
    if (isTomorrow) console.log("Put the", detail.type, "out tomorrow");
    if (isTomorrow) sendTelegramMessage(`Put the ${detail.type} out tomorrow`);
  })
  
  const nextMonthButton = await testEvolve.browser.button({ class: "rc-next" });
  await nextMonthButton.click();
  
  await testEvolve.browser.driver.sleep(2000)

  const nextMonthsEvents = await testEvolve.browser.driver.findElements(By.className("events-list"));

  const nextMonthsEventsLinks = await Promise.all(nextMonthsEvents.map(async event => await event.findElement(By.css("a"))))
  const nextMonthsEventsDetails = await Promise.all(nextMonthsEventsLinks.map(async link => ({ date: await link.getAttribute("data-original-datetext"), type: await link.getAttribute("data-original-title")})));


  nextMonthsEventsDetails.forEach(detail => {
    const eventDatetime = moment(new Date(detail.date)).endOf("day");
    const isTomorrow = tomorrow.diff(eventDatetime, "days") === 0;
    const isThisWeek = eventDatetime.diff(today, "days") <= 7 && eventDatetime.diff(today, "days") >= 0  && today.day() === 1;

    if (isThisWeek) console.log(`The ${detail.type} gets collected on ${eventDatetime.format("dddd")}`);
    if (isThisWeek) sendTelegramMessage(`The ${detail.type} gets collected on ${eventDatetime.format("dddd")}`)
    if (isTomorrow) console.log("Put the", detail.type, "out tomorrow");
    if (isTomorrow) sendTelegramMessage(`Put the ${detail.type} out tomorrow`);
  })
});

const sendTelegramMessage = async (message) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.error('Telegram bot token or chat ID is not defined.');
    return;
  }
  try {
    const response = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}