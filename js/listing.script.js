var imgExp = /\<img[^\>]+src="([^"]+)"([^\>])*\>/g;
var checkFloatURL = 'https://beta.glws.org/#';
const groupsExp = /^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview ([SM])(\d+)A(\d+)D(\d+)$/;
let SIH_State = [false, false];
const exclusionStickers = [
  "Don't Worry, I'm Pro",
  'Hi, My Game Is',
  'Run CT, Run',
  'Rock, Paper, Scissors (Foil)',
  'rain (Gold, Champion) | Antwerp 2022',
  'rain (Holo, Champion) | Antwerp 2022',
  'ropz (Holo, Champion) | Antwerp 2022',
  'Twistzz (Holo, Champion) | Antwerp 2022',
  'ropz (Glitter, Champion) | Antwerp 2022',
  'rain (Glitter, Champion) | Antwerp 2022',
  'broky (Holo, Champion) | Antwerp 2022',
  'Twistzz (Glitter, Champion) | Antwerp 2022',
  'Sbroky (Glitter, Champion) | Antwerp 2022',
  'karrigan (Holo, Champion) | Antwerp 2022',
  'karrigan (Gold, Champion) | Antwerp 2022',
  'Twistzz (Gold, Champion) | Antwerp 2022',
  'broky (Gold, Champion) | Antwerp 2022',
  'ropz (Gold, Champion) | Antwerp 2022',
  'karrigan (Glitter, Champion) | Antwerp 2022',
  'Jame (Champion) | Rio 2022',
  'qikert (Champion) | Rio 2022',
  'fame (Champion) | Rio 2022',
  'qikert (Gold, Champion) | Rio 2022',
  'fame (Gold, Champion) | Rio 2022',
  'fame (Holo, Champion) | Rio 2022',
  'qikert (Holo, Champion) | Rio 2022',
  'Jame (Gold, Champion) | Rio 2022',
  'qikert (Glitter, Champion) | Rio 2022',
  'Jame (Glitter, Champion) | Rio 2022',
  'Jame (Holo, Champion) | Rio 2022',
  'qikert (Holo, Champion) | Rio 2022',
  'FL1T (Champion) | Rio 2022',
  'FL1T (Holo, Champion) | Rio 2022',
  'FL1T (Gold, Champion) | Rio 2022',
  'FL1T (Glitter, Champion) | Rio 2022',
  'n0rb3r7 (Champion) | Rio 2022',
  'n0rb3r7 (Gold, Champion) | Rio 2022',
  'n0rb3r7 (Glitter, Champion) | Rio 2022',
  ' n0rb3r7 (Holo, Champion) | Rio 2022',
];

const SIH_BUY = 0,
  SIH_SELL = 1;

const g_exterior = {
  'Factory New': {
    min: 0.0,
    max: 0.07,
  },
  'Minimal Wear': {
    min: 0.07,
    max: 0.15,
  },
  'Field-Tested': {
    min: 0.15,
    max: 0.38,
  },
  'Well-Worn': {
    min: 0.38,
    max: 0.45,
  },
  'Battle-Scarred': {
    min: 0.45,
    max: 1.0,
  },
};

var CSGO_ORIGINS = [];
let countCallFloat = 0;
const floatDataArr = [];
const marketHashNameArr = [];
const containerArr = [];

const loadCsgoOriginNames = (callback = () => {}) => {
  if (Array.isArray(CSGO_ORIGINS) && CSGO_ORIGINS.length > 0) {
    callback();
  } else {
    $J.getJSON(`chrome-extension://${window.SIHID}/assets/json/csgo_origin_names.json`, (data) => {
      CSGO_ORIGINS = data;
      callback();
    });
  }
};
loadCsgoOriginNames();

const COOKIE_SIH_UNIQUE_INVENTORY_LIST_FILTER_SETTINGS = 'SIH_UNIQUE_INVENTORY_LIST_FILTER_SETTINGS';
var g_sihUniqueInventoryListFilterSettings = LocalStorageJSON.get(COOKIE_SIH_UNIQUE_INVENTORY_LIST_FILTER_SETTINGS);
g_sihUniqueInventoryListFilterSettings = g_sihUniqueInventoryListFilterSettings || {
  paintSeed: {},
  float: {},
};

$J('.market_listing_nav_container').append('<div class="market_nav"></div>');
$J('.market_listing_nav_container .market_nav').append($J('.market_listing_nav_container .market_listing_nav'));
$J('.market_listing_nav_container .market_nav').append(`
    <div id="switchPanel">
        <span style="margin-right: 10px;">SIH - Steam Inventory Helper</span>
        <label class="switch">
            <input id="switcher" type="checkbox" ${IS_ENABLED_SIH ? 'checked' : ''}>
            <span class="slider round"></span>
        </label>
    </div>
`);

$J('#switchPanel #switcher').change((e) => {
  const { currentTarget } = e;

  chrome.runtime.sendMessage(
    SIHID,
    { type: 'BACKGROUND_SET_SYNC_STORAGE', data: { key: 'enabledSih_listingPage', value: currentTarget.checked } },
    () => {
      window.location.reload();
    }
  );
});

// Set Float value for an item
const setFloatValue = function (data) {
  const $item = $J(`#listing_${data?.listingId}`);
  const floatDiv = $item.find(`#listing_${data?.listingId}_float`);

  if (data?.success && $item[0]) {
    $item[0].rgItem ||= {};
    $item[0].rgItem.info = data.iteminfo;
    $item[0].rgItem.elem = $item;

    floatDiv.find('.floatbutton').remove();
    floatDiv.find('.spinner').css('display', 'none');
    floatDiv.find('.float_data').css('display', 'block');
    floatDiv.find('.itemfloat .value').text(`${data.iteminfo.floatvalue}`);
    floatDiv.find('.itemseed .value').text(`${data.iteminfo.paintseed || 0}`);
    floatDiv.find('.itemindex .value').text(`${data.iteminfo.paintindex || 0}`);
    floatDiv.find('.float-bar .float-indicator').css('left', `${data.iteminfo.floatvalue * 300 - 5}px`);

    if (data.iteminfo.globalRatingPos || data.iteminfo.localRatingPos) {
      floatDiv
        .find('.item-position')
        .css('display', 'inline-flex')
        .tooltip({
          content: function () {
            return $J(this).prop('title');
          },
          position: {
            my: 'left bottom',
            at: 'left top',
          },
        });

      if (data.iteminfo.globalRatingPos) {
        floatDiv.find('.item-position .item-position__global').css('display', 'flex').find('.value').text(`
        ${
          data.iteminfo.globalRatingPos > 0
            ? `${data.iteminfo.globalRatingPos} low`
            : `${Math.abs(data.iteminfo.globalRatingPos)} high`
        }`);
      }

      if (data.iteminfo.localRatingPos) {
        floatDiv
          .find('.item-position .item-position__local')
          .css('display', 'flex')
          .find('.value')
          .text(`${data.iteminfo.localRatingPos}`);
      }
    }

    loadCsgoOriginNames(() => {
      const itemOrigin = CSGO_ORIGINS.find((item) => item.origin === data.iteminfo.origin);
      floatDiv.find('.itemorigin .value').html(itemOrigin.name);
    });

    // const additionalInfo = $J(`#listing_${data.listingId}`).find('.additional');
    // const additionalItems = ['itemid', 'defindex', 'paintindex', 'paintseed', 'quality', 'rarity', 'inventory'];
    // const fields = additionalItems.map(item => `<div class="item">${item}: <span class="value">${data.iteminfo[item]}</span></div>`);
    // additionalInfo.html(fields.join(''));

    // Выравнивание названия при предмета при подгрузке флоатов
    $item.find('.market_listing_item_name_block').css({ marginTop: 5 });
  }
};

// Set inventoryStickers wear for an item
const setStickersWearValues = function (data) {
  const { isRenderStickerPrice = true } = JSON.parse(localStorage.getItem('SIH_CONTROL_PANEL_MARKET_LISTINGS')) || {
    isRenderStickerPrice,
  };

  const floatDiv = $J(`#listing_${data.listingId}`).find(`#listing_${data.listingId}_float`);

  floatDiv.find('.spinner').css('display', 'none');

  // Sort stickers by slot
  data.iteminfo.stickers.sort((a, b) => (a.slot > b.slot ? 1 : -1));

  // Find the listing item block
  const listingDiv = $J(`#listing_${data.listingId}`);
  // Find all item's inventoryStickers
  const imagesDiv = listingDiv.find(`.sih-images .sticker-image img`);

  const imagesQty = imagesDiv.length;

  // Increase height of listing block
  if (imagesQty) {
    //listingDiv.css('height', '105px');
  }

  // Add wear info for to each sticker
  for (let i = 0; i < imagesQty; i += 1) {
    const sticker = data.iteminfo.stickers[i];
    // Check if no such sticker in float info then we stop/break this cycle (some exceptional situation)
    if (sticker === undefined) {
      break;
    }

    const wear = (sticker.wear || 0) * 100;
    $J(imagesDiv.eq(i)).css('opacity', 1 - Math.ceil(wear) * 0.0075);

    // Check if wear info already added
    const wearInfoDiv = imagesDiv.eq(i).next('.sticker-wear-info');
    if (!wearInfoDiv || !wearInfoDiv.length) {
      // Add wear info block into DOM after the sticker image
      const $container = imagesDiv.eq(i).parent();
      if (!$container.find('.sticker-wear-info').length) {
        imagesDiv.eq(i).parent().append(`
          <div class="sticker-wear-info">
            <p class="sticker-wear-info-value" style="display: ${isRenderStickerPrice ? 'none' : 'block'};">${wear === 0 ? 0 : wear.toFixed(2)}%</p>
            <p class="sticker-price-info-value" style="display: ${isRenderStickerPrice ? 'block' : 'none'};"></p>
          </div>
        `);
      }
    }
  }

  // Add data info for keychain
  if (data.iteminfo.keychains?.length) {
    const $keychain = $J(`#listing_${data.listingId}`).find('.sih-keychains .keychain-image');

    if (!$keychain.find('.keychain-price').length) {
      const keychainInfo = data.iteminfo.keychains[0];

      $keychain.append(
        `<p class="keychain-price" data-hash-name="${keychainInfo.name}" data-pattern="${keychainInfo.pattern}"></p>`
      );
    }
  }
};
const stickersData = {};

const setStickersPriceValuesHtml = function ($container, marketHashName, imagesDiv) {
  const stickerBlock = $J($container).parent().parent().parent();
  $J($container).each((index, image) => {
    if (!$J(image).data('price')) {
      $J(image).attr('data-price', stickersData[marketHashName]);
      const imageUrl = $J(image).attr('src');
      const title = marketHashName;
      const name = title.replace(/Sticker \|/, '').trim();
      const percent = $J(image).parent().find('.sticker-wear-info-value').text();
      // Add single tooltip for sticker
      addTooltipForStickers(
        $J($container).parent(),
        imageUrl,
        title,
        name,
        stickersData[marketHashName],
        percent,
        0,
        true
      );
    }
  });
  sumStickersPrice(stickerBlock);
};
var sumStickersPrice = function (stickerBlock) {
  let totalSum = 0;
  let totalPriceFormated;
  if ($J(stickerBlock).parent().find('.sticker-sum').length === 0) {
    stickerBlock.after(
      `<div><div class="sticker-sum"><span class="text">${SIHLang.market.stickerTotalPrice}: </span> <span class="text text_white value value-price"></span></div></div>`
    );
  }
  const stickerSumBlock = stickerBlock.parent().find('.sticker-sum');
  const stickersList = $J(stickerBlock).find('.sih-image');
  stickersList.each((idx, elem) => {
    const imageUrl = $J(elem).attr('src');
    const title = $J(elem).attr('title');
    const name = title.replace(/Sticker \|/, '').trim();
    const priceData = $J(elem).data('price');
    const percent = $J(elem).parent().find('.sticker-wear-info-value').text();
    if (priceData) {
      const price = priceData.match(new RegExp(/\d+[0-9,.]?\d*/g));
      totalSum += Number(price);
      totalPriceFormated = SIH?.CurrencyService?.getPriceFromCurrency(totalSum, currencyId, currencyId);
      totalPriceFormated = totalPriceFormated.text.replace('руб.', '₽');
      let priceFormated = SIH?.CurrencyService?.getPriceFromCurrency(Number(price), currencyId, currencyId);
      priceFormated = priceFormated.text.replace('руб.', '₽');
      // Add tooltip for all stickers
      addTooltipForStickers(stickerSumBlock, imageUrl, title, name, priceFormated, percent, idx);
    }
  });

  //Price for a place wear
  stickersList.each((idx, elem) => {
    const priceData = $J(elem).data('price');
    $J(elem).parent().find('.sticker-price-info-value').text(priceData);
  });

  stickerBlock.parent().find('.sticker-sum .value-price').text(totalPriceFormated);
};

var addTooltipForStickers = function (
  $container,
  imageUrl,
  title,
  name,
  price,
  percent,
  preffixClass = 0,
  single = false
) {
  if ($J($container).next('.sih-tooltip').length === 0) {
    $J($container).after(`<div class="sih-tooltip"></div>`);
  }
  if ($J($container).parent().find(`.sih-tooltip__row_${preffixClass}`).length === 0) {
    const rowEl = `<div class="sih-tooltip__row sih-tooltip__row_${preffixClass}" data-sort="${preffixClass}">
        <div class="sih-tooltip__left-block">
          <div class="sih-tooltip__image"><img src="${imageUrl}" title="${title}"></div>
          <div class="sih-tooltip__name">${name}</div>
        </div>
        <div class="sih-tooltip__right-block">
          <span class="sih-tooltip__price">${price}</span>
          <span class="sih-tooltip__percent">${percent}</span>
        </div>
      </div>`;
    $J($container).parent().find('.sih-tooltip').append(rowEl);
    if (!single) {
      sortTooltipRows($container);
    }
  }
};

const addTooltipForKeychains = function ($container, imageUrl, hashName, name, price, pattern) {
  if ($container.next('.sih-tooltip').length === 0) {
    $container.after(`<div class="sih-tooltip"></div>`);
  }

  if ($container.parent().find(`.sih-tooltip__row`).length === 0) {
    const rowEl = `<div class="sih-tooltip__row">
        <div class="sih-tooltip__left-block">
          <div class="sih-tooltip__image"><img src="${imageUrl}" title="${hashName}"></div>
          <div class="sih-tooltip__name">${name}</div>
        </div>
        <div class="sih-tooltip__right-block sih-tooltip__right-block_keychain">
          <span class="sih-tooltip__price">${price}</span>
          <span class="sih-tooltip__percent">Paint seed: ${pattern}</span>
        </div>
      </div>`;
    $container.parent().find('.sih-tooltip').append(rowEl);
  }
};

var sortTooltipRows = function ($container) {
  const listTooltip = $J($container)
    .find('.sih-tooltip__row')
    .sort(function (a, b) {
      if ($J(a).data('sort') > $J(b).data('sort')) {
        return 1;
      } else if ($J(a).data('sort') < $J(b).data('sort')) {
        return -1;
      }
      return 0;
    });
  const tooltipBlock = $J($container).find('.sih-tooltip');
  $J(listTooltip).detach().appendTo(tooltipBlock);
};

var changeTitleForStickers = function ($row, data) {
  $J($row)
    .find('.sticker-image')
    .each((index, element) => {
      $J(element).children('img').attr('title', `Sticker | ${data.iteminfo.stickers[index].name}`);
      $J(element).children('img').attr('title_2', `Sticker | ${data.iteminfo.stickers[index].name}`);
      $J(element).children('img').attr('hash_name', `Sticker | ${data.iteminfo.stickers[index].name}`);
    });
};

const setStickersPriceValues = async function (data) {
  countCallFloat++;

  floatDataArr.push(data);
  const lengthRows = $J('#searchResultsRows').find(
    '.market_listing_row.market_recent_listing_row[id^="listing_"]'
  ).length;

  if (countCallFloat === lengthRows) {
    countCallFloat = 0;

    prebuildStickersData(floatDataArr);

    const stickersPrice = getStickerPriceFromAPI(marketHashNameArr);

    // Выставляем цены по всем стикерам после того, как получили цены с апи
    Promise.all([stickersPrice]).then(() => {
      $J(containerArr).each((index, element) => {
        $J(element).each((index, elem) => {
          const hashName = $J(elem).attr('hash_name');
          if (marketHashNameArr.includes(hashName)) {
            setStickersPriceValuesHtml(elem, hashName);
          }
        });
      });
    });

    const keychainHashNames = [];

    floatDataArr.forEach((data) => {
      if (data.iteminfo.keychains?.length) {
        keychainHashNames.push(data.iteminfo.keychains[0].name);
      }
    });

    getKeychainPriceFromAPI(keychainHashNames).then((results) => {
      for (const [hashName, price] of Object.entries(results)) {
        $J(`.sih-keychains .keychain-price[data-hash-name="${hashName}"]`).each((index, elem) => {
          $J(elem).text(price);
          const $keychainBlock = $J(elem).parent();
          const imageUrl = $keychainBlock.find('img').attr('src');
          const name = hashName.replace(/Charm \|/, '').trim();
          const pattern = $J(elem).attr('data-pattern');
          addTooltipForKeychains($keychainBlock, imageUrl, hashName, name, price, pattern);
        });
      }
    });

    floatDataArr.length = 0;
  }
};

var prebuildStickersData = function (floatDataArr) {
  $J(floatDataArr).each(async (index, data) => {
    const $row = $J(`#listing_${data.listingId}`);

    for (let i = 0; i < data.iteminfo.stickers.length; i++) {
      if (exclusionStickers.includes(data.iteminfo.stickers[i].name)) {
        changeTitleForStickers($row, data);
        break;
      }
    }

    if (!($row.length && $row[0].rgItem)) {
      return;
    }

    const appId = +$row[0].rgItem.appid;

    if (!appId === 730) {
      return;
    }

    const imagesDiv = $J(`#listing_${data.listingId} .sih-images .sticker-image img`);
    $J(imagesDiv).addClass('sih-image');

    // Add wear info for to each sticker
    for (let i = 0; i < imagesDiv.length; i++) {
      const sticker = data.iteminfo.stickers[i];
      // Check if no such sticker in float info then we stop/break this cycle (some exceptional situation)
      if (sticker === undefined) {
        break;
      }

      const marketHashName = `Sticker | ${sticker.name}`;
      const $container = imagesDiv.eq(i);
      $J($container).attr('hash_name', marketHashName);

      containerArr.push($container);

      if (!marketHashNameArr.includes(marketHashName)) {
        marketHashNameArr.push(marketHashName);
      }
    }
  });
};

var getStickerPriceFromAPI = function (marketHashNameArr, appId = 730) {
  return new Promise((resolve, reject) => {
    if (!marketHashNameArr.length) {
      resolve({});
      return;
    }

    chrome.runtime.sendMessage(
      SIHID,
      {
        type: 'GET_PRICES_BY_MARKETPLACES',
        data: {
          appId: appId,
          markets: ['steamLiveSell', 'buff163'],
          items: marketHashNameArr,
        },
      },
      (res) => {
        if (res.success) {
          for (const key in res.items) {
            if (res.items[key]['steamLiveSell']) {
              const price = res.items[key]['steamLiveSell'].price;
              const priceFormat = SIH?.CurrencyService.getPriceFromCurrency(price, currencyId);
              stickersData[key] = priceFormat.text.replace('руб.', '₽');
            } else if (res.items[key]['buff163']) {
              const price = res.items[key]['buff163'].price;
              const priceFormat = SIH?.CurrencyService.getPriceFromCurrency(price, currencyId);
              stickersData[key] = priceFormat.text.replace('руб.', '₽');
            }
          }
          resolve(stickersData);
        }
      }
    );
  });
};

const getKeychainPriceFromAPI = function (marketHashNameArr, appId = 730) {
  return new Promise((resolve, reject) => {
    const keychainData = {};
    if (!marketHashNameArr.length) {
      resolve({});
      return;
    }

    chrome.runtime.sendMessage(
      SIHID,
      {
        type: 'GET_PRICES_BY_MARKETPLACES',
        data: {
          appId: appId,
          markets: ['steamLiveSell', 'buff163'],
          items: marketHashNameArr,
        },
      },
      (res) => {
        if (res.success) {
          for (const key in res.items) {
            if (res.items[key]['steamLiveSell']) {
              const price = res.items[key]['steamLiveSell'].price;
              const priceFormat = SIH?.CurrencyService.getPriceFromCurrency(price, currencyId);
              keychainData[key] = priceFormat.text.replace('руб.', '₽');
            } else if (res.items[key]['buff163']) {
              const price = res.items[key]['buff163'].price;
              const priceFormat = SIH?.CurrencyService.getPriceFromCurrency(price, currencyId);
              keychainData[key] = priceFormat.text.replace('руб.', '₽');
            }
          }
          resolve(keychainData);
        }
      }
    );
  });
};

var SetPhaseColors = function () {
  if (!window.show_phase_color_listing) return;

  $J('.market_listing_row[id^="listing_"]').each(function () {
    var $row = $J(this);
    var idListing = $J(this).attr('id').substring(8);
    var rgListing = g_rgListingInfo[idListing];
    var asset = null;
    if (rgListing) {
      asset = g_rgListingInfo[idListing].asset;
    } else {
      return;
    }

    var rgItem = g_rgAssets[asset.appid][asset.contextid][asset.id];

    window.InventoryItemRarity.colorizeItem(rgItem, null, true, {
      disableBorderColorization: true,
      onBackGroundColor: (
        (row) => (color) =>
          row.find('.market_listing_item_img').css('background-color', `#${color}`)
      )($row),
    });
  });
};

function marketListingsRequestOnSuccessBefore(url, data, transport) {}

function marketListingsRequestOnSuccessAfter(url, data, transport) {
  SIH?.controlPanelForTableUniqueInventories?.load();
  SIH?.paginationForTableUniqueInventories?.load();
  SIH?.ManualRenderListing();
  SIH?.priceDisplayUniqueInventory?.load();
  SIH?.phaseOfItems?.load();
  SIH?.other?.colorSihButtons();
  SIH?.other?.marketActionMenuButtonClick();
}

function getCurrencyCode() {
  try {
    return window.GetCurrencyCode(window.currencyId) || undefined;
  } catch (e) {
    return undefined;
  }
}

function parseItemData() {
  const appId = +Object.keys(g_rgAssets)?.[0];
  const contextId = +Object.keys(g_rgAssets?.[appId] || {})?.[0];
  const item = Object.values(g_rgAssets?.[appId]?.[contextId])?.[0];

  if (!appId || !contextId || !item) return false;

  const originalAppId = item.market_fee_app || null;
  const marketHashName = item.market_hash_name;

  const { isRenderSecond } = JSON.parse(localStorage.getItem('SIH_PRICE_HISTORY_GRAPH')) || { isRenderSecond: true };

  return {
    appId,
    originalAppId,
    uid: window?.SIH_TOKEN,
    marketHashName,
    link: location.href,
    country: window?.g_strCountryCode,
    lang: window?.g_strLanguage,
    currency: getCurrencyCode(),
    itemType: item.type,
    enableVolumeGraph: isRenderSecond,
  };
}

function registerViewItemEvent() {
  const item = parseItemData();

  if (!item) return;

  const data = {
    type: 'view-item',
    payload: item,
  };
  chrome.runtime.sendMessage(SIHID, { type: 'EVENT_STORE', data });
}

function loadRate() {
  ExchangeRates.GetRate((isLoad) => {
    if (isLoad) {
      SIH?.inventoryInfoWarning?.load();
      SIH?.stickersUnderInventoryAvatar?.load();
      SIH?.blockOfMarketplaces?.load();
      SIH?.favoritesButton?.load();
      SIH?.accordionInventoryDescription?.load();
      SIH?.buttonInspectInGame?.load();
      SIH?.blockBestOfferOfMarketplace?.load();
      SIH?.marketCommodityOrderBlock?.load();
      SIH?.overPrices?.LoadOverPricesListing();
    } else {
      setTimeout(() => {
        loadRate();
      }, 500);
    }
  });
}

if (IS_ENABLED_SIH) {
  $J(function () {
    $J('html').attr('translate', 'no');
    registerViewItemEvent();
    loadRate();

    if (typeof g_oSearchResults != 'undefined' && (g_oSearchResults || {}).OnAJAXComplete) {
      g_oSearchResults.OnAJAXComplete = function () {
        g_oSearchResults.m_bLoading = false;
        SIH?.inventoryStickers?.loadInTable();
        SetPhaseColors();
        marketListingsRequestOnSuccessAfter();
        SIH?.priceDisplayUniqueInventory?.load();
        $J('.market_listing_right_cell .market_listing_row_action a').remove();
      };

      if (window.noOfRows && window.noOfRows != 10) {
        const availableVariants = [10, 20, 100];
        const isAvailableVariants = availableVariants.includes(window.noOfRows);
        g_oSearchResults.m_cPageSize = isAvailableVariants ? window.noOfRows : 10;
        g_oSearchResults.GoToPage(0, true);
      } else {
        SIH?.inventoryStickers?.loadInTable();
        SetPhaseColors();
        marketListingsRequestOnSuccessAfter();
        $J('.market_listing_right_cell .market_listing_row_action a').remove();
        //marketListingPage.filterUniqueInventory.load();
      }

      var btReload = $J(
        `<a href="#" class="btn_grey_white_innerfade btn_small" accesskey="r"><span>${SIHLang.market.reloadlistings}</span></a>`
      );
      const $searchResultsTable = $J('#searchResultsTable');
      const $doc = $J([document.documentElement, document.body]);
      btReload.click(function () {
        g_oSearchResults.m_cMaxPages = g_oSearchResults.m_iCurrentPage + 1;
        g_oSearchResults.GoToPage(g_oSearchResults.m_iCurrentPage, true);

        // Scroll lo search results table
        $doc.animate({ scrollTop: $searchResultsTable.offset().top }, 10);

        return false;
      });
      if ($J('.market_listing_filter_clear_button_container').length == 0) {
        $J('#market_listing_filter_form').append('<div class="market_listing_filter_clear_button_container">');
      }
      $J('.market_listing_filter_clear_button_container').prepend(btReload);
      $J('#listings').on('click', '.sih-images img, .sih-keychains img', function () {
        let hashStickerName = $J(this).prop('title') || $J(this).attr('title_2');
        var link =
          g_strLanguage === 'english'
            ? 'https://steamcommunity.com/market/listings/730/' + encodeURIComponent(hashStickerName)
            : 'https://steamcommunity.com/market/search?q=' + encodeURIComponent(hashStickerName);
        window.open(link, '_blank');
      });

      // выбираем целевой элемент
      var target = document.getElementById('market_buynow_dialog');

      // создаём экземпляр MutationObserver
      var observer = new MutationObserver(function (mutations) {
        const isVisible = $J('#market_buynow_dialog').is(':visible');
        if (isVisible) {
          $J('#market_buynow_dialog .market_listing_game_name').show();
          $J('#market_buynow_dialog .sih-market-action').hide();
          if ($J('#market_buynow_dialog .float_block').find('.floatbutton').length) {
            $J('#market_buynow_dialog .float_block').hide();
          }
        }
      });

      // конфигурация нашего observer:
      var config = { attributes: true };

      // передаём в качестве аргументов целевой элемент и его конфигурацию
      observer.observe(target, config);
    }
    SIH?.other?.performBlockMove();
    SIH?.marketListingFilter?.load();
    SIH?.RenderSIHGraph();
  });

  // Prototype Steam

  let AjaxRequestMaster = Ajax.Request;
  Ajax.Request = function (url, data) {
    data.sihData = data.sihData || {};

    const onSuccess = data.onSuccess;
    data.onSuccess = function (transport) {
      if (url.indexOf('/market/listings') > -1) {
        marketListingsRequestOnSuccessBefore(url, data, transport);
      }

      onSuccess(transport);
      // if (url.indexOf('/market/listings') > -1) {
      //   marketListingsRequestOnSuccessAfter(url, data, transport);
      // }
    };

    const onFailure = data.onFailure;
    data.onFailure = function (transport) {
      onFailure(transport);
    };

    new AjaxRequestMaster(url, data);
  };
  Ajax.Request.__proto__ = AjaxRequestMaster;

  var BuildHoverMaster = BuildHover;
  var BuildHover = (prefix, item, owner) => {
    BuildHoverMaster(prefix, item, owner);

    if (item.appid !== 440) {
      getLowestPriceHandler(item, prefix);
    }
  };

  const AjaxMaster = $J.ajax;
  $J.ajax = function (req) {
    if (req.url.includes('/market/itemordershistogram')) {
      SIH?.marketCommodityOrderBlock?.setItemNameID(req.data.item_nameid);
      req.data.currency = SIH?.marketCommodityOrderBlock?.getCurrency() || req.data.currency;
    }

    return AjaxMaster(req)
      .success((res) => {
        if (req.url.includes('/market/itemordershistogram')) {
          const { encodedHashName, appId } = prebuildCardData();

          const statDay = +$J('.stat_day')
            .html()
            .replace(/&nbsp;/g, '');
          const statWeek = +$J('.stat_week')
            .html()
            .replace(/&nbsp;/g, '');
          const statMonth = +$J('.stat_month')
            .html()
            .replace(/&nbsp;/g, '');

          const steamSoldData = {
            day: statDay,
            week: statWeek,
            month: statMonth,
          };

          SIH?.SihUserPrices?.sendItemData(
            res,
            +appId,
            encodedHashName,
            +req.data.currency,
            steamSoldData,
            req.data.language
          );

          SIH?.marketCommodityOrderBlock?.showButtonFromData('buy', res.buy_order_graph);
          SIH?.marketCommodityOrderBlock?.showButtonFromData('sell', res.sell_order_graph);

          res.sell_order_table = SIH?.marketCommodityOrderBlock?.getOrderHtmlTable('sell', res, true);

          res.buy_order_table = SIH?.marketCommodityOrderBlock?.getOrderHtmlTable('buy', res, false);
        }
        return res;
      })
      .error((err) => {
        return err;
      });
  };

  SIH?.CasePricesService?.updateSteamPricesInCasePanel();

  function prebuildCardData() {
    let appId;

    if (Object.keys(g_rgAppContextData).length === 1) {
      appId = +Object.entries(g_rgAppContextData)?.[0]?.[0];
    } else {
      if (g_rgAppContextData.hasOwnProperty('753')) {
        const index = Object.entries(g_rgAppContextData).findIndex((val) => val[0] === '753');
        appId = +Object.entries(g_rgAppContextData)?.[index]?.[0];
      }
    }

    const contextId = +Object.keys(g_rgAssets?.[appId] || {})?.[0];

    if (!appId) return false;

    const item = Object.values(g_rgAssets?.[appId]?.[contextId] || {})?.[0];

    if (!item) return false;

    const encodedHashName = encodeURIComponent(item.market_hash_name).replace(/\(/g, '%28').replace(/\)/g, '%29');

    return { encodedHashName, appId };
  }
}

const processFloatData = (data) => {
  setFloatValue(data);
  setStickersWearValues(data);
  setStickersPriceValues(data);
};
