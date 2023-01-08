import * as cheerio from "cheerio";
import fetch from "node-fetch";
import {writeFile} from "node:fs/promises";
import path from "node:path";

const URLS = {
  leaderboard: "https://kingsleague.pro/estadisticas/clasificacion/",
};

async function scrape(url) {
  const res = await fetch(url);
  const html = await res.text();
  return cheerio.load(html);
}

async function getLeaderBoard() {
  const $ = await scrape(URLS.leaderboard);
  const $rows = $('table tbody tr')
  // const LEADERBOARD_SELECTORS_PREFIX = "table tbody tr";

  const LEADERBOARD_SELECTORS = {
    team: {selector: ".fs-table-text_3", typeOf: 'string'},
    wins: {selector: ".fs-table-text_4", typeOf: 'number'},
    loses: {selector: ".fs-table-text_5", typeOf: 'number'},
    scoredGoals: {selector: ".fs-table-text_6", typeOf: 'number'},
    concededGoals: {selector: ".fs-table-text_7", typeOf: 'number'},
    yellowCards: {selector: ".fs-table-text_8", typeOf: 'number'},
    redCards: {selector: ".fs-table-text_9", typeOf: 'number'},
  };

  const clearText = (text) =>
    text.replace(/\t|\n|\s:/g, "").replace(/.*:/g, " ");

  const leaderBoardSelectorEntries = Object.entries(LEADERBOARD_SELECTORS)
  const leaderBoard = []
  $rows.each((index, el) => {
    const leaderBoardEntries = leaderBoardSelectorEntries.map(
      ([key,{selector,typeOf}]) => {
        const rawValue = $(el).find(selector).text();
        const cleanValue = clearText(rawValue)
        const value = typeOf === 'number'? Number(cleanValue):cleanValue;
        return [key, value];
      }
    );
    leaderBoard.push(Object.fromEntries(leaderBoardEntries))
    // console.log(Object.fromEntries(leaderBoardEntries))
  })
  return leaderBoard;
}

const leaderBoard = await getLeaderBoard();
const filePath = path.join(process.cwd(),'db','leaderboard.json');
await writeFile(filePath, JSON.stringify(leaderBoard,null,2),'utf-8')
