/*
 * Copyright (c) 2021 wilmaplus-foodmenu, developed by @developerfromjokela, for Wilma Plus mobile app
 */

import {Request, Response} from "express";
import {errorResponse, responseStatus} from "../utils/response_utilities";
import {Builder, By, ThenableWebDriver} from "selenium-webdriver";
import {Restaurant} from "../models/Restaurant";
import {AsyncIterator} from "../utils/iterator";
import {elementLocated} from "selenium-webdriver/lib/until";
import {Http} from "../net/http";
import {parse} from "../parsers/aromiv2";
import {CacheContainer} from "node-ts-cache";
import {MemoryStorage} from "node-ts-cache-storage-memory";
import {HashUtils} from "../crypto/hash";
import {Day} from "../models/Day";
import {Diet} from "../models/Diet";
import {Options} from "selenium-webdriver/chrome";

const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;
let httpClient = new Http();
let userCache = new CacheContainer(new MemoryStorage());


function getRestaurantList(driver: ThenableWebDriver) {
    return new Promise<Restaurant[]>((resolve, reject) => {
        driver.findElement(By.id("MainContent_RestaurantDropDownList")).then(element => {
            let restaurants:Restaurant[] = [];
            element.findElements(By.css("option")).then(options => {
                new AsyncIterator((item, iterator) => {
                    item.getAttribute("textContent").then(name => {
                        if (name != null) {
                            item.getAttribute("value").then(id => {
                                if (id != null) {
                                    restaurants.push(new Restaurant(id, name));
                                    iterator.nextItem();
                                } else
                                    iterator.nextItem();
                            }).catch(() => {
                                iterator.nextItem();
                            });
                        } else
                            iterator.nextItem();
                    }).catch(() => {
                        iterator.nextItem();
                    });
                }, options.splice(1, options.length-1), () => {
                    resolve(restaurants);
                }).start();
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });

}

function selectRestaurant(driver: ThenableWebDriver, id: string) {
    return new Promise<void>((resolve, reject) =>  {
        getRestaurantList(driver).then(restaurants => {
            let position = -1;
            restaurants.forEach((restaurant, index) => {
                if (restaurant.id == id) {
                    position = index
                }
            });
            if (position === -1) {
                reject(new Error("Restaurant not found, check the ID"));
                return;
            }
            driver.findElement(By.id("MainContent_RestaurantDropDownList-button")).then(button => {
                button.click().then(() => {
                    driver.findElement(By.id("MainContent_RestaurantDropDownList-menu")).then(dropDown => {
                        dropDown.findElements(By.css("li")).then(listItems => {
                            if (position > listItems.length-1) {
                                reject(new Error("Restaurant not found, check the ID"));
                                return;
                            }
                            let listItem = listItems[position];
                            listItem.click().then(() => {
                                resolve();
                            }).catch(error => {
                                reject(error);
                            });
                        }).catch(error => {
                            reject(error);
                        });
                    }).catch(error => {
                        reject(error);
                    });
                }).catch(error => {
                    reject(error);
                });
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });

}

function getRestaurantPDFLink(driver: ThenableWebDriver) {
    return new Promise<string>((resolve, reject) => {
        driver.wait(elementLocated(By.id("MainContent_PdfUrl"))).then(() => {
            driver.findElement(By.id("MainContent_PdfUrl")).then(pdfUrl => {
                pdfUrl.getAttribute("href").then(url => {
                    resolve(url);
                }).catch(error => {
                    reject(error);
                });
            }).catch(error => {
                reject(error);
            });
        }).catch(error => {
            reject(error);
        });
    });
}

export function getMenuOptions(req: Request, res: Response) {
    if (!req.params.url) {
        responseStatus(res, 400, false, {cause: 'URL not specified!'});
        return;
    }
    let url = req.params.url;
    if (!url.match(urlRegex)) {
        responseStatus(res, 400, false, {cause: 'Invalid of malformed URL!'});
        return;
    }
    let hashKey = HashUtils.sha1Digest(url+"_aroma");
    userCache.getItem(hashKey).then(cachedValue => {
        if (cachedValue) {
            responseStatus(res, 200, true, {restaurants: cachedValue});
        } else {
            let options = new Options().headless();
            if ((global as any).chromeArgs != null) {
                options.addArguments((global as any).chromeArgs.split(","));
            }
            const driver = new Builder().forBrowser("chrome").setChromeOptions(options).build();
            driver.get(url+"/Default.aspx").then(() => {
                getRestaurantList(driver).then(restaurants => {
                    userCache.setItem(hashKey, restaurants, {ttl: 3600}).then(() => {
                        responseStatus(res, 200, true, {restaurants});
                        driver.close();
                    }).catch(error => {
                        responseStatus(res, 500, false, {cause: error.toString()});
                        driver.close();
                    });
                }).catch(error => {
                    responseStatus(res, 500, false, {cause: error.toString()});
                    driver.close();
                });
            }).catch(error => {
                responseStatus(res, 500, false, {cause: error.toString()});
                driver.close();
            });
        }
    }).catch(error => {
        responseStatus(res, 500, false, {cause: error.toString()});
    });

}

export function getRestaurantPage(req: Request, res: Response) {
    if (!req.params.url || !req.params.id) {
        responseStatus(res, 400, false, {cause: 'Required parameters not specified!'});
        return;
    }
    let url = req.params.url;
    let id = req.params.id;
    if (!url.match(urlRegex)) {
        responseStatus(res, 400, false, {cause: 'Invalid of malformed URL!'});
        return;
    }
    const fetchDocument = (pdfUrl: string) => {
        const fetchDate = (date: string, callback: (restaurants: Day[], diets: Diet[]) => void, errorCallback: (error: Error | null) => void) => {
            httpClient.get(pdfUrl.replace("%dmd%", date), (error, response) =>  {
                if (error || response == undefined) {
                    errorCallback(error);
                    return;
                }
                parse(response.body, (restaurants, diets) => {
                    if (restaurants == undefined || diets == undefined) {
                        errorCallback(new Error("Unable to parse menu!"));
                        return;
                    }
                    callback(restaurants, diets);
                });
            });
        };
        const contains = (item: string, items: Diet[]) => {
            let found = false;
            items.forEach(item2 => {
                if (item.toLowerCase() == item2.name.toLowerCase())
                    found = true;
            });
            return found;
        }
        fetchDate("1", (restaurants, diets) => {
            fetchDate("2", ((restaurants1, diets1) => {
                fetchDate("3", ((restaurants2, diets2) => {
                    restaurants1.forEach(item => restaurants.push(item));
                    restaurants2.forEach(item => restaurants.push(item));
                    diets1.forEach(dItem => {if (!contains(dItem.name, diets)) {diets.push(dItem)}});
                    diets2.forEach(dItem => {if (!contains(dItem.name, diets)) {diets.push(dItem)}});
                    responseStatus(res, 200, true, {menu: restaurants, diets: diets});
                }), error => {
                    errorResponse(res, 500, error);
                    return;
                });
            }), error => {
                errorResponse(res, 500, error);
                return;
            });
        }, error => {
            errorResponse(res, 500, error);
            return;
        })
    }
    let hashKey = HashUtils.sha1Digest(url+"_"+id);
    userCache.getItem(hashKey).then(value => {
        // Check if cached value exists
        if (value)
            fetchDocument(value as string);
        else {
            let options = new Options().headless();
            if ((global as any).chromeArgs != null) {
                options.addArguments((global as any).chromeArgs.split(","));
            }
            const driver = new Builder().forBrowser("chrome").setChromeOptions(options).build();
            driver.get(url+"/Default.aspx").then(() => {
                selectRestaurant(driver, id).then(() => {
                    getRestaurantPDFLink(driver).then(pdfUrl => {
                        driver.close();
                        pdfUrl = pdfUrl.replace("DateMode=0", "DateMode=%dmd%");
                        userCache.setItem(hashKey, pdfUrl, {ttl: 3600}).then(() => {
                            fetchDocument(pdfUrl);
                        }).catch(error => {
                            responseStatus(res, 500, false, {cause: error.toString()});
                        });
                    }).catch(error => {
                        responseStatus(res, 500, false, {cause: error.toString()});
                        driver.close();
                    });
                }).catch(error => {
                    responseStatus(res, 500, false, {cause: error.toString()});
                    driver.close();
                });
            }).catch(error => {
                responseStatus(res, 500, false, {cause: error.toString()});
                driver.close();
            });
        }
    })

}