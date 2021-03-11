/*
 * Copyright (c) 2021 wilmaplus-foodmenu, developed by @developerfromjokela, for Wilma Plus mobile app
 */

import moment from 'moment';
import {Day} from "../models/Day";
import {Menu} from "../models/Menu";
import {Moment} from "moment/moment";
import {Meal} from "../models/Meal";
import {HashUtils} from "../crypto/hash";
import {Diet} from "../models/Diet";

const pdfParser = require("pdfreader");

const dateRegex = /[0-9]+\.[0-9]+\.[0-9]{4}/;

const type = "aromiv2";


export function parse(content: any, callback: (content: Day[]|undefined, diets: Diet[]|undefined) => void) {
    let rows: any = {}; // indexed by y-position
    let days: Day[] = [];
    let diets: Diet[] = [];
    new pdfParser.PdfReader().parseBuffer(content, (pdfError: Error, pdf: any) => {
        if (pdfError) {
            console.error(pdfError);
            callback(undefined, undefined);
            return;
        }
        if (!pdf || pdf.page) {
            let items = Object.keys(rows).sort((y1, y2) => parseFloat(y1) - parseFloat(y2));
            let lastDate: Moment|null = null;
            let tempMenuList:Menu[] = [];
            items.forEach(key => {
                let item = rows[key];
                if (item.length > 0) {
                    let firstEntry = item[0];
                    if (firstEntry.text.match(dateRegex)) {
                        // Date found
                        let regexResult = dateRegex.exec(firstEntry.text);
                        if (regexResult != null) {
                            if (tempMenuList.length > 0 && lastDate != null) {
                                days.push(new Day(lastDate, tempMenuList));
                                tempMenuList = [];
                            }
                            lastDate = moment(regexResult[0], "DD.MM.YYYY").startOf('day');
                        }
                    } else if (lastDate != null) {
                        let mealType = "Lounas";
                        let items: Meal[] = [];
                        for (let meal of item) {
                            if (meal.x < 3 && meal.x > 1) {
                                mealType = meal.text;
                            } else if (meal.x > 4) {
                                items.push(new Meal(HashUtils.sha1Digest(type+mealType+"_"+meal.text), meal.text));
                            }
                        }
                        tempMenuList.push(new Menu(mealType, items));
                    }
                }
            });
            if (tempMenuList.length > 0 && lastDate != null) {
                days.push(new Day(lastDate, tempMenuList));
                tempMenuList = [];
            }
            try {
                if (items.length > 0) {
                    let dietsText = rows[items[items.length-1]][0].text;
                    let dietSplit = dietsText.split(", ")
                    for (let dietItem of dietSplit) {
                        let parts = dietItem.split(" - ");
                        if (parts.length > 1) {
                            diets.push(new Diet(parts[0], parts[1]));
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
            if (!pdf) {
                days.sort((i1: Day, i2:Day) => {
                    return i1.date.unix()-i2.date.unix();
                });
                // Formatting date after sorting
                let correctedDateDays = days;
                correctedDateDays.forEach((item, index) => {
                    item.date = (item.date.format() as any);
                    correctedDateDays[index] = item;
                });
                callback(correctedDateDays, diets);
            }
        } else if (pdf.text) {
            // accumulate text items into rows object, per line
            (rows[pdf.y] = rows[pdf.y] || []).push({text: pdf.text, x: pdf.x});
        }
    });
}